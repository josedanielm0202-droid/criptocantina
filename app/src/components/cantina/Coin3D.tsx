import { useEffect, useRef } from "react"
import { useLang } from "../../hooks/useLang"
import { useGuide } from "./Guide"
import { Mascot } from "./Mascot"

/**
 * Moneda 3D en CSS (capas apiladas) que gira sola y se puede arrastrar.
 * Es el "sello" del contrato.
 */
export function Coin3D() {
	const { t } = useLang()
	const { say } = useGuide()
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const el = ref.current
		if (!el) return
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
		let rx = -12
		let ry = 0
		let vx = 0
		let vy = reduce ? 0 : 0.35
		let drag = false
		let lx = 0
		let ly = 0
		let spun = 0
		let raf = 0
		const tick = () => {
			if (!drag) {
				ry += vy
				rx += vx
				vx *= 0.94
				vy += ((reduce ? 0 : 0.35) - vy) * 0.02
				rx += (-12 - rx) * 0.03
			}
			el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
			raf = requestAnimationFrame(tick)
		}
		const down = (e: PointerEvent) => {
			drag = true
			lx = e.clientX
			ly = e.clientY
			el.setPointerCapture(e.pointerId)
		}
		const move = (e: PointerEvent) => {
			if (!drag) return
			const dx = e.clientX - lx
			const dy = e.clientY - ly
			lx = e.clientX
			ly = e.clientY
			ry += dx * 0.6
			rx -= dy * 0.4
			vy = dx * 0.6
			vx = -dy * 0.4
			spun += Math.abs(dx)
		}
		const up = () => {
			drag = false
			if (spun > 500) {
				say("guide.coin", "nervioso", 2400)
				spun = 0
			}
		}
		el.addEventListener("pointerdown", down)
		window.addEventListener("pointermove", move)
		window.addEventListener("pointerup", up)
		raf = requestAnimationFrame(tick)
		return () => {
			cancelAnimationFrame(raf)
			el.removeEventListener("pointerdown", down)
			window.removeEventListener("pointermove", move)
			window.removeEventListener("pointerup", up)
		}
	}, [say])

	const layers = Array.from({ length: 14 }, (_, i) => i)

	return (
		<div className="coin-stage">
			<div className="coin" ref={ref} title={t("contract.coin")}>
				{layers.map((i) => (
					<span
						key={i}
						className="coin__edge"
						style={{ transform: `translateZ(${(i - 6.5) * 1.6}px)` }}
					/>
				))}
				<div className="coin__face coin__face--front">
					<Mascot size={110} idle={false} expression="divertido" />
				</div>
				<div className="coin__face coin__face--back">
					<span className="mono">SOROBAN</span>
					<b>C…5E3V</b>
					<span className="mono">TESTNET</span>
				</div>
			</div>
			<span className="coin-hint mono">↔ {t("contract.coin")}</span>
		</div>
	)
}
