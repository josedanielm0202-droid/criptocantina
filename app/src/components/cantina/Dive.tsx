import { useEffect, useRef } from "react"
import { useLang } from "../../hooks/useLang"
import {
	clamp01,
	getLenis,
	lerp,
	prefersReducedMotion,
	scrollToY,
} from "../../lib/smooth"
import { Hero, INTRO_DONE } from "./Hero"
import { EXPRESSIONS, type Expression, Mascot } from "./Mascot"
import { onFrame, trackBox } from "./ScrollFX"

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOutCubic = (t: number) =>
	t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/** 8 pantallas alrededor de la central: una por expresión del personaje. */
const TILES: { c: number; r: number; e: Expression; light?: boolean }[] = [
	{ c: -1, r: -1, e: "divertido" },
	{ c: 0, r: -1, e: "sorprendido" },
	{ c: 1, r: -1, e: "determinado" },
	{ c: -1, r: 0, e: "emocionado", light: true },
	{ c: 1, r: 0, e: "nervioso" },
	{ c: -1, r: 1, e: "triste" },
	{ c: 0, r: 1, e: "enojado" },
	{ c: 1, r: 1, e: "neutral" },
]

/**
 * Intro estilo neutomni: el personaje y el título aparecen grandes; al bajar,
 * la cámara se zambulle en la pantalla central de una cuadrícula y la página
 * empieza adentro. Todo con transform/opacity en un solo rAF.
 */
export function Dive() {
	const { t, lang } = useLang()
	const sec = useRef<HTMLElement>(null)
	const world = useRef<HTMLDivElement>(null)
	const screen = useRef<HTMLDivElement>(null)
	const chrome = useRef<HTMLDivElement>(null)
	const tiles = useRef<HTMLDivElement>(null)
	const titleL = useRef<HTMLSpanElement>(null)
	const titleR = useRef<HTMLSpanElement>(null)
	const hero = useRef<HTMLDivElement>(null)
	const fg = useRef<HTMLDivElement>(null)
	const cue = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const s = sec.current
		if (!s) return
		const root = document.documentElement
		let doneSent = false
		const done = () => {
			root.classList.remove("in-intro")
			if (!doneSent) {
				doneSent = true
				window.dispatchEvent(new Event(INTRO_DONE))
			}
		}

		if (prefersReducedMotion()) {
			s.classList.add("dive--static")
			done()
			return
		}

		root.classList.add("in-intro")
		// Intro automático al cargar (cuando las fuentes estén listas)
		let played = false
		const play = () => {
			if (played) return
			played = true
			s.classList.add("dive--play")
		}
		void document.fonts?.ready.then(play)
		const safety = setTimeout(play, 700)

		let pS = -1
		let lastKey = ""
		let s0 = 0.34
		let vwPrev = 0

		// Top/alto de la sección cacheados: el bucle no lee el layout en cada frame
		const { box, untrack } = trackBox(s)

		const off = onFrame((y, vh) => {
			if (box.height <= 0) return
			const vw = window.innerWidth
			if (vw !== vwPrev) {
				vwPrev = vw
				s0 = vw < 700 ? 0.5 : 0.34
				const gap = vw < 700 ? vw * 0.045 : vw * 0.022
				world.current?.style.setProperty("--s0", String(s0))
				world.current?.style.setProperty("--gap", `${gap}px`)
			}
			const total = box.height - vh
			const raw = clamp01(total > 0 ? -(box.top - y) / total : 1)
			// Lenis ya suaviza la rueda; en touch (scroll nativo) suavizamos aquí
			pS = pS < 0 ? raw : getLenis() ? raw : lerp(pS, raw, 0.25)
			if (Math.abs(pS - raw) < 0.0005) pS = raw
			const p = pS

			const key = `${p.toFixed(4)}|${vw}|${vh}`
			if (key === lastKey) return
			lastKey = key

			const a = easeOutCubic(clamp01(p / 0.32)) // salida de título/personaje
			const z = easeInOutCubic(clamp01((p - 0.1) / 0.82)) // zoom de cámara
			const k = (0.92 + 0.08 * a) * Math.pow(1 / s0, z)
			const full = z >= 0.999

			if (world.current)
				world.current.style.transform = full ? "none" : `scale(${k.toFixed(5)})`
			if (screen.current) {
				screen.current.style.transform = full ? "none" : `scale(${s0})`
				const radius = (16 * (1 - z)) / (s0 * k)
				screen.current.style.borderRadius = full
					? "0"
					: `${radius.toFixed(2)}px`
			}
			if (chrome.current)
				chrome.current.style.opacity = String(1 - clamp01((z - 0.7) / 0.22))
			if (tiles.current) {
				tiles.current.style.opacity = String(
					(0.35 + 0.65 * a) * (1 - clamp01((z - 0.55) / 0.35)),
				)
				tiles.current.style.visibility = full ? "hidden" : "visible"
			}
			if (hero.current)
				hero.current.style.opacity = String(0.55 + 0.45 * clamp01(a * 1.4))

			const split = a * vw * 0.6
			const tOp = String(1 - clamp01((a - 0.25) / 0.6))
			if (titleL.current) {
				titleL.current.style.transform = `translate3d(${(-split).toFixed(1)}px,0,0)`
				titleL.current.style.opacity = tOp
			}
			if (titleR.current) {
				titleR.current.style.transform = `translate3d(${split.toFixed(1)}px,0,0)`
				titleR.current.style.opacity = tOp
			}
			if (fg.current) {
				fg.current.style.setProperty("--a", a.toFixed(4))
				fg.current.style.visibility = a >= 0.999 ? "hidden" : "visible"
			}
			if (cue.current)
				cue.current.style.opacity = String(1 - clamp01((p - 0.02) / 0.08))
			s.classList.toggle("dive--inside", p > 0.985)

			if (p > 0.985) done()
			else if (doneSent) root.classList.add("in-intro")
		})

		return () => {
			off()
			untrack()
			clearTimeout(safety)
			root.classList.remove("in-intro")
		}
	}, [])

	const skip = () => {
		const s = sec.current
		if (!s) return
		const end = s.offsetTop + s.offsetHeight - window.innerHeight
		scrollToY(end, 2)
	}

	const [w1, w2] = lang === "es" ? ["CRIPTO", "CANTINA"] : ["CRYPTO", "CANTINA"]

	return (
		<section className="dive" ref={sec} aria-label={t("nav.brand")}>
			<div className="dive__stage">
				<div className="dive__world" ref={world}>
					<div className="dive__tiles" ref={tiles} aria-hidden>
						{TILES.map((tile, i) => (
							<div
								key={tile.e}
								className={`tile ${tile.light ? "tile--light" : ""}`}
								style={{ ["--c" as string]: tile.c, ["--r" as string]: tile.r }}
							>
								<span className="tile__label mono">
									0{EXPRESSIONS.indexOf(tile.e) + 1} / {t(`mood.${tile.e}`)}
								</span>
								<span
									className="tile__mascot"
									style={{ ["--d" as string]: `${i * -0.4}s` }}
								>
									<Mascot size="100%" expression={tile.e} idle={false} />
								</span>
								<span className="tile__foot mono">
									CC/{String(i + 2).padStart(2, "0")}
								</span>
							</div>
						))}
					</div>
					<div className="dive__screen" ref={screen}>
						<div className="dive__chrome mono" ref={chrome} aria-hidden>
							<span className="dots">
								<i />
								<i />
								<i />
							</span>
							<span>cripto-cantina.app</span>
							<span>TESTNET</span>
						</div>
						<div className="dive__hero" ref={hero}>
							<Hero />
						</div>
					</div>
				</div>

				<div className="dive__fg" ref={fg} aria-hidden>
					<p className="dive__tag mono">{t("intro.tag")}</p>
					<div className="dive__title">
						<span ref={titleL} className="dive__word">
							{w1.split("").map((ch, i) => (
								<span key={`${lang}a${i}`} style={{ ["--i" as string]: i }}>
									{ch}
								</span>
							))}
						</span>
						<span ref={titleR} className="dive__word">
							{w2.split("").map((ch, i) => (
								<span
									key={`${lang}b${i}`}
									style={{ ["--i" as string]: i + w1.length }}
								>
									{ch}
								</span>
							))}
						</span>
					</div>
					<div className="dive__mascot">
						<span className="dive__bubble-wrap">
							<span className="dive__bubble">{t("intro.hello")}</span>
						</span>
						<Mascot size="100%" expression="neutral" />
					</div>
				</div>

				<div className="dive__ui" ref={cue}>
					<div className="dive__cut mono" aria-hidden>
						<span className="dive__scissors">✂</span>
						<span className="dive__dash" />
						<span>{t("hero.cut")}</span>
					</div>
					<span className="dive__cue mono">
						{t("intro.cue")} <span className="dive__arrow">↓</span>
					</span>
				</div>
				<button type="button" className="dive__skip mono" onClick={skip}>
					{t("intro.skip")} ↧
				</button>
			</div>
		</section>
	)
}
