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

/**
 * Un solo bucle rAF para toda la página:
 * - avanza Lenis (scroll suave)
 * - `--scroll` (0..1) en <html> para la barra de progreso
 * - `--p` (0..1) en cada `[data-p]` (lee todo primero y escribe después, para
 *   no forzar layouts intercalados)
 * - `.is-in` en cada `[data-reveal]` cuando aparece
 * - avisa a los componentes suscritos con `onFrame`
 */
export function ScrollFX() {
	useEffect(() => {
		const root = document.documentElement
		const lenis = startSmooth()
		let raf = 0
		let lastY = -1
		let lastH = -1
		let lastVh = -1

		const frame = (time: number) => {
			raf = requestAnimationFrame(frame)
			lenis?.raf(time)
			const y = window.scrollY
			const vh = window.innerHeight
			const h = root.scrollHeight
			const moved = y !== lastY || h !== lastH || vh !== lastVh
			if (moved) {
				lastY = y
				lastH = h
				lastVh = vh
				const max = h - vh
				// lecturas
				const els = document.querySelectorAll<HTMLElement>("[data-p]")
				const vals: string[] = []
				els.forEach((el) => {
					const r = el.getBoundingClientRect()
					const sticky = el.dataset.p === "sticky"
					const total = sticky ? r.height - vh : r.height + vh
					const done = sticky ? -r.top : vh - r.top
					const p = Math.min(1, Math.max(0, total > 0 ? done / total : 0))
					vals.push(p.toFixed(4))
				})
				// escrituras
				root.style.setProperty("--scroll", max > 0 ? (y / max).toFixed(4) : "0")
				els.forEach((el, i) => el.style.setProperty("--p", vals[i] ?? "0"))
			}
			listeners.forEach((fn) => fn(y, vh))
		}
		raf = requestAnimationFrame(frame)

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
		const mo = new MutationObserver(observeAll)
		mo.observe(document.body, { childList: true, subtree: true })

		return () => {
			cancelAnimationFrame(raf)
			io.disconnect()
			mo.disconnect()
			if (getLenis()) stopSmooth()
		}
	}, [])
	return null
}
