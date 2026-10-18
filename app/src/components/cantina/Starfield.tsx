import { useEffect, useRef } from "react"

const COLORS = ["#21DEFA", "#A178FF", "#4285F4", "#EAEEDD"]

/**
 * Campo de estrellas en canvas con profundidad (parallax con el mouse y el
 * scroll). Liviano: ~140 partículas, se pausa cuando no se ve.
 */
export function Starfield({ className = "" }: { className?: string }) {
	const ref = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = ref.current
		if (!canvas) return
		const ctx = canvas.getContext("2d")
		if (!ctx) return
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
		let w = 0
		let h = 0
		let dpr = 1
		let raf = 0
		let visible = true
		const mouse = { x: 0, y: 0, tx: 0, ty: 0 }

		const N = window.innerWidth < 700 ? 80 : 150
		const stars = Array.from({ length: N }, () => ({
			x: Math.random(),
			y: Math.random(),
			z: Math.random() * 0.9 + 0.1,
			c: COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#EAEEDD",
			tw: Math.random() * Math.PI * 2,
		}))

		const resize = () => {
			dpr = Math.min(window.devicePixelRatio || 1, 2)
			w = canvas.clientWidth
			h = canvas.clientHeight
			canvas.width = w * dpr
			canvas.height = h * dpr
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
		}

		const draw = (time: number) => {
			raf = 0
			mouse.x += (mouse.tx - mouse.x) * 0.05
			mouse.y += (mouse.ty - mouse.y) * 0.05
			const sy = window.scrollY
			ctx.clearRect(0, 0, w, h)
			for (const s of stars) {
				const px = (s.x * w + mouse.x * 40 * s.z + w) % w
				const py =
					(((s.y * h - sy * 0.25 * s.z + mouse.y * 30 * s.z) % h) + h) % h
				const tw = reduce ? 1 : 0.6 + 0.4 * Math.sin(time / 700 + s.tw)
				const r = s.z * 1.8
				ctx.globalAlpha = 0.25 + 0.6 * s.z * tw
				ctx.fillStyle = s.c
				ctx.beginPath()
				ctx.arc(px, py, r, 0, Math.PI * 2)
				ctx.fill()
				if (s.z > 0.85) {
					ctx.globalAlpha = 0.12 * tw
					ctx.beginPath()
					ctx.arc(px, py, r * 4, 0, Math.PI * 2)
					ctx.fill()
				}
			}
			ctx.globalAlpha = 1
			if (visible && !reduce) raf = requestAnimationFrame(draw)
		}

		const onMove = (e: PointerEvent) => {
			mouse.tx = e.clientX / window.innerWidth - 0.5
			mouse.ty = e.clientY / window.innerHeight - 0.5
		}
		const io = new IntersectionObserver(([e]) => {
			visible = Boolean(e?.isIntersecting)
			if (visible && !raf) raf = requestAnimationFrame(draw)
		})
		io.observe(canvas)
		resize()
		raf = requestAnimationFrame(draw)
		window.addEventListener("resize", resize)
		window.addEventListener("pointermove", onMove, { passive: true })
		return () => {
			if (raf) cancelAnimationFrame(raf)
			io.disconnect()
			window.removeEventListener("resize", resize)
			window.removeEventListener("pointermove", onMove)
		}
	}, [])

	return <canvas ref={ref} className={`starfield ${className}`} aria-hidden />
}
