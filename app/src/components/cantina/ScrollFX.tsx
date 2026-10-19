import { useEffect } from "react"
import { getLenis, startSmooth, stopSmooth } from "../../lib/smooth"

export type FrameListener = (scrollY: number, vh: number) => void

const listeners = new Set<FrameListener>()

/** Suscribirse al bucle de animación compartido (1 solo rAF para toda la página). */
export function onFrame(fn: FrameListener) {
	listeners.add(fn)
	return () => {
		listeners.delete(fn)
	}
}

/** Posición de un elemento en el documento, medida fuera del bucle de scroll. */
export interface TrackedBox {
	/** top relativo al documento (no al viewport) */
	top: number
	height: number
}

const tracked = new Map<Element, TrackedBox>()
let requestMeasure = () => {}

/**
 * Cachea el top/alto de `el` en coordenadas del documento. Se vuelve a medir
 * solo cuando cambia el tamaño de la página o de la ventana, así el bucle de
 * scroll nunca tiene que leer el layout (getBoundingClientRect) en cada frame.
 */
export function trackBox(el: Element) {
	const box: TrackedBox = { top: 0, height: 0 }
	tracked.set(el, box)
	requestMeasure()
	return {
		box,
		untrack: () => {
			tracked.delete(el)
		},
	}
}

interface PItem {
	el: HTMLElement
	top: number
	height: number
	sticky: boolean
	last: string
}

/**
 * Un solo bucle rAF para toda la página:
 * - avanza Lenis (scroll suave)
 * - `--scroll` (0..1) solo en la barra de progreso (`.rail`); antes iba en
 *   <html> y obligaba a recalcular los estilos de TODA la página en cada frame
 * - `--p` (0..1) en cada `[data-p]`, calculado con medidas cacheadas y escrito
 *   solo cuando cambia
 * - `.is-in` en cada `[data-reveal]` cuando aparece
 * - avisa a los componentes suscritos con `onFrame`
 */
export function ScrollFX() {
	useEffect(() => {
		const root = document.documentElement
		const lenis = startSmooth()
		let raf = 0
		let lastY = Number.NaN
		let vh = window.innerHeight
		let docH = 0
		let items: PItem[] = []
		let rail: HTMLElement | null = null
		let lastScroll = ""
		let needMeasure = true
		let dirty = true

		const measure = () => {
			needMeasure = false
			dirty = true
			const y = window.scrollY
			vh = window.innerHeight
			docH = root.scrollHeight
			const prev = new Map(items.map((it) => [it.el, it.last]))
			items = Array.from(
				document.querySelectorAll<HTMLElement>("[data-p]"),
				(el) => {
					const r = el.getBoundingClientRect()
					return {
						el,
						top: r.top + y,
						height: r.height,
						sticky: el.dataset.p === "sticky",
						last: prev.get(el) ?? "",
					}
				},
			)
			tracked.forEach((box, el) => {
				const r = el.getBoundingClientRect()
				box.top = r.top + y
				box.height = r.height
			})
			const nextRail = document.querySelector<HTMLElement>(".topbar .rail")
			if (nextRail !== rail) lastScroll = ""
			rail = nextRail
		}
		requestMeasure = () => {
			needMeasure = true
		}

		const frame = (time: number) => {
			raf = requestAnimationFrame(frame)
			lenis?.raf(time)
			if (needMeasure) measure()
			const y = window.scrollY
			if (y !== lastY || dirty) {
				lastY = y
				dirty = false
				// lecturas: nada del layout, todo sale de las medidas cacheadas
				const vals = items.map((it) => {
					const top = it.top - y
					const total = it.sticky ? it.height - vh : it.height + vh
					const done = it.sticky ? -top : vh - top
					return Math.min(1, Math.max(0, total > 0 ? done / total : 0)).toFixed(4)
				})
				// escrituras (solo si cambió el valor)
				items.forEach((it, i) => {
					const v = vals[i] ?? "0"
					if (v !== it.last) {
						it.last = v
						it.el.style.setProperty("--p", v)
					}
				})
				const max = docH - vh
				const s = max > 0 ? Math.min(1, Math.max(0, y / max)).toFixed(4) : "0"
				if (rail && s !== lastScroll) {
					lastScroll = s
					rail.style.setProperty("--scroll", s)
				}
			}
			listeners.forEach((fn) => fn(y, vh))
		}
		raf = requestAnimationFrame(frame)

		// Re-medir solo cuando cambia el tamaño de la página o de la ventana
		const ro = new ResizeObserver(requestMeasure)
		ro.observe(document.body)
		window.addEventListener("resize", requestMeasure, { passive: true })
		void document.fonts?.ready.then(requestMeasure)

		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => {
					if (e.isIntersecting) {
						e.target.classList.add("is-in")
						io.unobserve(e.target)
					}
				}),
			{ threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
		)
		const observeAll = () =>
			document
				.querySelectorAll("[data-reveal]:not(.is-in)")
				.forEach((el) => io.observe(el))
		observeAll()
		// Agrupar mutaciones: como mucho una pasada por frame
		let moQueued = false
		const mo = new MutationObserver(() => {
			if (moQueued) return
			moQueued = true
			requestAnimationFrame(() => {
				moQueued = false
				observeAll()
				needMeasure = true
			})
		})
		mo.observe(document.body, { childList: true, subtree: true })

		return () => {
			cancelAnimationFrame(raf)
			ro.disconnect()
			window.removeEventListener("resize", requestMeasure)
			io.disconnect()
			mo.disconnect()
			requestMeasure = () => {}
			if (getLenis()) stopSmooth()
		}
	}, [])
	return null
}
