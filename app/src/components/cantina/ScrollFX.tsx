import { useEffect } from "react"

/**
 * Un solo bucle de scroll para toda la página:
 * - `--scroll` (0..1) en <html> para la barra de progreso.
 * - `--p` (0..1) en cada elemento con `data-p`: cuánto lo recorriste.
 * - `.is-in` en cada `[data-reveal]` cuando aparece en pantalla.
 */
export function ScrollFX() {
	useEffect(() => {
		const root = document.documentElement
		let raf = 0
		const update = () => {
			raf = 0
			const vh = window.innerHeight
			const max = root.scrollHeight - vh
			root.style.setProperty(
				"--scroll",
				max > 0 ? (window.scrollY / max).toFixed(4) : "0",
			)
			document.querySelectorAll<HTMLElement>("[data-p]").forEach((el) => {
				const r = el.getBoundingClientRect()
				// sticky: progreso dentro de la sección alta; normal: de entrar a salir
				const sticky = el.dataset.p === "sticky"
				const total = sticky ? r.height - vh : r.height + vh
				const done = sticky ? -r.top : vh - r.top
				const p = Math.min(1, Math.max(0, total > 0 ? done / total : 0))
				el.style.setProperty("--p", p.toFixed(4))
			})
		}
		const onScroll = () => {
			if (!raf) raf = requestAnimationFrame(update)
		}
		update()
		window.addEventListener("scroll", onScroll, { passive: true })
		window.addEventListener("resize", onScroll)

		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => {
					if (e.isIntersecting) {
						e.target.classList.add("is-in")
						io.unobserve(e.target)
					}
				}),
			{ threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
		)
		const observeAll = () =>
			document
				.querySelectorAll("[data-reveal]:not(.is-in)")
				.forEach((el) => io.observe(el))
		observeAll()
		// observar elementos que aparecen después (lista de firmas, etc.)
		const mo = new MutationObserver(observeAll)
		mo.observe(document.body, { childList: true, subtree: true })

		return () => {
			window.removeEventListener("scroll", onScroll)
			window.removeEventListener("resize", onScroll)
			if (raf) cancelAnimationFrame(raf)
			io.disconnect()
			mo.disconnect()
		}
	}, [])
	return null
}
