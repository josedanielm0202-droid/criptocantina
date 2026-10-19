import { useEffect, useRef, useState } from "react"
import { useLang } from "../../hooks/useLang"
import { clamp01, lerp } from "../../lib/smooth"
import { useGuide } from "./Guide"
import { type Expression, Mascot } from "./Mascot"
import { onFrame } from "./ScrollFX"

export const INTRO_DONE = "cantina:intro-done"

/**
 * Portada de la página. Vive dentro de la "pantalla" del intro: cuando la
 * cámara termina de entrar, esto es lo primero que se ve.
 */
export function Hero() {
	const { t, lang } = useLang()
	const { sayOnce, mood } = useGuide()
	const [heroMood, setHeroMood] = useState<Expression>("neutral")
	const plateRef = useRef<HTMLDivElement>(null)
	const word = lang === "es" ? "CRIPTO CANTINA" : "CRYPTO CANTINA"

	// Saludo cuando termina el intro
	useEffect(() => {
		let b: ReturnType<typeof setTimeout> | undefined
		const hello = () => {
			sayOnce("hello", "guide.hello", "emocionado", 3400)
			b = setTimeout(
				() => sayOnce("scroll", "guide.scroll", "divertido", 3200),
				4200,
			)
		}
		window.addEventListener(INTRO_DONE, hello)
		return () => {
			window.removeEventListener(INTRO_DONE, hello)
			clearTimeout(b)
		}
	}, [sayOnce])

	// Mirada + leve inclinación de la placa, suavizadas con lerp en el rAF común
	useEffect(() => {
		const el = plateRef.current
		if (!el) return
		const target = { x: 0, y: 0 }
		const cur = { x: 0, y: 0 }
		const onMove = (e: PointerEvent) => {
			const r = el.getBoundingClientRect()
			target.x = clamp01((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1
			target.y = clamp01((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1
		}
		window.addEventListener("pointermove", onMove, { passive: true })
		const off = onFrame(() => {
			const dx = target.x - cur.x
			const dy = target.y - cur.y
			if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return
			cur.x = lerp(cur.x, target.x, 0.08)
			cur.y = lerp(cur.y, target.y, 0.08)
			el.style.setProperty("--lx", cur.x.toFixed(3))
			el.style.setProperty("--ly", cur.y.toFixed(3))
		})
		return () => {
			window.removeEventListener("pointermove", onMove)
			off()
		}
	}, [])

	return (
		<section className="hero" id="inicio">
			<div className="hero__top mono">
				<span>{t("hero.tag")}</span>
				<span className="hide-sm">CC/26 — 01</span>
				<span>{t("hero.scroll")} ↓</span>
			</div>

			<h1 className="wordmark" aria-label={word}>
				{word.split("").map((ch, i) => (
					<span
						key={`${lang}-${i}`}
						className="wordmark__ch"
						style={{ ["--i" as string]: i }}
					>
						{ch === " " ? "\u00a0" : ch}
					</span>
				))}
			</h1>

			<div className="hero__sub-row mono">
				<span>{t("hero.studio")}</span>
				<nav className="hero__nav">
					<a href="#recorrido">{t("hero.nav.steps")}</a>
					<a href="#firmar">{t("hero.nav.sign")}</a>
					<a href="#libro">{t("hero.nav.book")}</a>
					<a href="#contrato">{t("hero.nav.contract")}</a>
				</nav>
			</div>

			<div className="hero__grid">
				<div className="hero__copy">
					<p className="hero__lines">
						<span>{t("hero.line1")}</span>{" "}
						<em className="serif">{t("hero.line2")}</em>{" "}
						<span>{t("hero.line3")}</span>
					</p>
					<p className="hero__sub">{t("hero.sub")}</p>
					<a href="#firmar" className="btn btn--primary btn--lg">
						{t("hero.cta")} <span aria-hidden>→</span>
					</a>
				</div>

				<div className="plate" ref={plateRef}>
					<span className="plate__corner plate__corner--tl" aria-hidden />
					<span className="plate__corner plate__corner--tr" aria-hidden />
					<span className="plate__corner plate__corner--bl" aria-hidden />
					<span className="plate__corner plate__corner--br" aria-hidden />
					<div className="plate__head mono">
						<span>{t("hero.plate")}</span>
						<span>
							{t("hero.expr")}: {t(`mood.${heroMood}`)}
						</span>
					</div>
					<button
						type="button"
						className="plate__mascot"
						tabIndex={-1}
						aria-hidden
						onPointerEnter={() => setHeroMood("sorprendido")}
						onPointerLeave={() => setHeroMood("neutral")}
						onClick={() => {
							setHeroMood("emocionado")
							mood("emocionado", 2000)
						}}
					>
						<Mascot size="100%" expression={heroMood} />
					</button>
					<div className="plate__foot mono">
						<span className="tagline">require_auth()</span>
						<span className="tagline tagline--b">listar()</span>
					</div>
				</div>
			</div>

			<div className="cutline mono" aria-hidden>
				<span>✂</span>
				<span className="cutline__dash" />
				<span>{t("hero.cut")}</span>
			</div>
		</section>
	)
}
