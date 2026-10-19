import Lenis from "lenis"

/**
 * Scroll suave (Lenis) compartido por toda la página. Si el usuario prefiere
 * menos movimiento no se activa y todo usa el scroll nativo.
 */
let lenis: Lenis | null = null

export const prefersReducedMotion = () =>
	typeof window !== "undefined" &&
	window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function startSmooth(): Lenis | null {
	if (lenis || prefersReducedMotion()) return lenis
	lenis = new Lenis({
		// Inercia suave pero responsiva; el touch queda nativo en móvil
		lerp: 0.085,
		wheelMultiplier: 0.9,
		anchors: { offset: -72 },
		autoRaf: false,
	})
	return lenis
}

export function stopSmooth() {
	lenis?.destroy()
	lenis = null
}

export const getLenis = () => lenis

/** Para el scroll (p. ej. con el panel de ayuda abierto). */
export function lockScroll(locked: boolean) {
	if (locked) lenis?.stop()
	else lenis?.start()
	document.body.classList.toggle("no-scroll", locked)
}

const easeInOut = (t: number) =>
	t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/** Scroll animado hacia una posición absoluta (o nativo si no hay Lenis). */
export function scrollToY(y: number, duration = 1.4) {
	if (lenis) lenis.scrollTo(y, { duration, easing: easeInOut })
	else
		window.scrollTo({
			top: y,
			behavior: prefersReducedMotion() ? "auto" : "smooth",
		})
}

/** Interpolación lineal: base de todos los suavizados con rAF. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
