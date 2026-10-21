import { labPrefix } from "@stellar-scaffold/app-lib"
import {
	lazy,
	startTransition,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react"
import { useGuide } from "../components/cantina/Guide"
import { Mascot } from "../components/cantina/Mascot"
import { Near } from "../components/cantina/Near"
import { SignForm } from "../components/cantina/SignForm"
import { useFirmadoLive, useFirmas } from "../hooks/useFirmas"
import { useInView } from "../hooks/useInView"
import { useLang } from "../hooks/useLang"
import { type DictKey } from "../i18n"
import { CONTRACT_ID, contractUrl, MAX_BYTES } from "../lib/guestbook"
import { prefersReducedMotion } from "../lib/smooth"

// Piezas pesadas que se cargan al acercarse (ver Near)
const SignatureList = lazy(() =>
	import("../components/cantina/SignatureList").then((m) => ({
		default: m.SignatureList,
	})),
)
const Coin3D = lazy(() =>
	import("../components/cantina/Coin3D").then((m) => ({ default: m.Coin3D })),
)

/** Texto que se "enciende" palabra por palabra con el scroll. */
function ScrollWords({
	text,
	from,
	to,
}: {
	text: string
	from: number
	to: number
}) {
	const words = text.split(" ")
	return (
		<>
			{words.map((w, i) => {
				const at = from + ((to - from) * i) / words.length
				return (
					<span
						key={`${w}-${i}`}
						className="sw"
						style={{ ["--at" as string]: at.toFixed(3) }}
					>
						{w}{" "}
					</span>
				)
			})}
		</>
	)
}

/** Cinta corrida estilo "DESIGN • WEBFLOW • STRATEGY" de neutomni. */
function Marquee({ count }: { count: number | undefined }) {
	const { t } = useLang()
	const items = [
		count === undefined
			? "— " + t("hero.stats.firmas")
			: count === 1
				? t("list.count1")
				: t("list.count", { n: count }),
		"firmar()",
		`${MAX_BYTES} ${t("hero.stats.max")}`,
		"require_auth()",
		`1 ${t("hero.stats.once")}`,
		"listar()",
		"Stellar Testnet",
		"#firmado",
	]
	const row = (
		<span className="marquee__row">
			{items.map((it) => (
				<span key={it} className="marquee__item">
					{it}
					<span className="marquee__dot" aria-hidden>
						●
					</span>
				</span>
			))}
		</span>
	)
	return (
		<div className="marquee mono" aria-label={items.join(" · ")}>
			<div className="marquee__track" aria-hidden>
				{row}
				{row}
			</div>
		</div>
	)
}

function Intro() {
	const { t } = useLang()
	const { sayOnce } = useGuide()
	const ref = useRef<HTMLElement>(null)
	const inView = useInView(ref, { threshold: 0.2 })
	useEffect(() => {
		if (inView) sayOnce("intro", "guide.intro", "sorprendido")
	}, [inView, sayOnce])
	return (
		<section className="intro grid-bg" data-p="sticky" ref={ref}>
			<div className="intro__sticky">
				<span className="kicker mono">{t("intro.kicker")}</span>
				<p className="intro__text">
					<ScrollWords text={t("intro.a")} from={0} to={0.3} />
					<span className="arrow">→ </span>
					<em className="serif">
						<ScrollWords text={t("intro.b")} from={0.3} to={0.55} />
					</em>
					<ScrollWords text={t("intro.c")} from={0.55} to={0.8} />
				</p>
				<p className="intro__note mono">{t("intro.note")}</p>
			</div>
		</section>
	)
}

const SHAPES = ["circle", "diamond", "star", "check"] as const

function Steps() {
	const { t } = useLang()
	const { sayOnce } = useGuide()
	const ref = useRef<HTMLElement>(null)
	const inView = useInView(ref, { threshold: 0.15 })
	useEffect(() => {
		if (inView) sayOnce("steps", "guide.steps", "determinado")
	}, [inView, sayOnce])

	return (
		<section className="steps grid-bg" data-p="sticky" ref={ref} id="recorrido">
			<div className="steps__sticky">
				<header className="section-head">
					<span className="kicker mono">01 / {t("steps.kicker")}</span>
					<h2>
						{t("steps.title")}{" "}
						<em className="serif">{t("steps.titleItalic")}</em>
					</h2>
				</header>
				<div className="steps__cards">
					{[1, 2, 3, 4].map((n, i) => (
						<article key={n} className="step" style={{ ["--k" as string]: i }}>
							<span className="step__n mono">0{n}</span>
							<div
								className={`step__shape step__shape--${SHAPES[i]}`}
								aria-hidden
							>
								<span className="step__track" />
								<span className="step__obj" />
							</div>
							<h3>
								{t(`steps.${n}.t` as DictKey)}{" "}
								<em className="serif">{t(`steps.${n}.ti` as DictKey)}</em>
							</h3>
							<p>{t(`steps.${n}.d` as DictKey)}</p>
						</article>
					))}
				</div>
			</div>
		</section>
	)
}

function Contract() {
	const { t } = useLang()
	const { say, sayOnce } = useGuide()
	const [copied, setCopied] = useState(false)
	const ref = useRef<HTMLElement>(null)
	const inView = useInView(ref, { threshold: 0.35 })
	useEffect(() => {
		if (inView) sayOnce("contract", "guide.contract", "determinado")
	}, [inView, sayOnce])

	const copy = () => {
		void navigator.clipboard?.writeText(CONTRACT_ID).then(() => {
			setCopied(true)
			say("guide.copied", "divertido", 2600)
			setTimeout(() => setCopied(false), 1800)
		})
	}

	return (
		<section className="contract" id="contrato" ref={ref} data-p>
			<header className="section-head" data-reveal>
				<span className="kicker mono">{t("contract.kicker")}</span>
				<h2>
					{t("contract.title")}{" "}
					<em className="serif">{t("contract.titleItalic")}</em>
				</h2>
			</header>
			<div className="contract__grid">
				<Near minHeight={420} className="near-coin">
					<Coin3D />
				</Near>
				<div className="contract__info" data-reveal>
					<p>{t("contract.desc")}</p>
					<div className="cid">
						<code className="mono">{CONTRACT_ID}</code>
						<div className="cid__actions">
							<button type="button" className="btn btn--ghost" onClick={copy}>
								{copied ? t("contract.copied") : t("contract.copy")}
							</button>
							<a
								className="btn btn--ghost"
								href={contractUrl()}
								target="_blank"
								rel="noreferrer"
							>
								{t("contract.view")}
							</a>
						</div>
					</div>
					<ul className="fns mono">
						<li>
							<b>firmar</b>(autor, mensaje){" "}
							<span>// {t("contract.fn.firmar")}</span>
						</li>
						<li>
							<b>listar</b>() <span>// {t("contract.fn.listar")}</span>
						</li>
						<li>
							<b>#firmado</b> <span>// {t("contract.fn.evento")}</span>
						</li>
					</ul>
				</div>
			</div>
		</section>
	)
}

function Footer() {
	const { t, lang } = useLang()
	return (
		<footer className="footer">
			<div className="footer__word" aria-hidden>
				<span>{lang === "es" ? "CRIPTO" : "CRYPTO"}</span>
				<span className="footer__mascot">
					<Mascot size="100%" expression="divertido" />
				</span>
				<span>CANTINA</span>
			</div>
			<div className="footer__row mono">
				<span>{t("footer.made")}</span>
				<nav>
					<a href={contractUrl()} target="_blank" rel="noreferrer">
						stellar.expert ↗
					</a>
					<a href={labPrefix()} target="_blank" rel="noreferrer">
						{t("footer.lab")}
					</a>
					<a href="#inicio">{t("footer.top")}</a>
				</nav>
			</div>
		</footer>
	)
}

const STAGES = 6

/**
 * Las secciones se montan por partes, una por momento libre del navegador,
 * en transiciones que no bloquean los frames (el intro sigue fluido).
 */
function useStagedMount() {
	const [n, setN] = useState(() => (prefersReducedMotion() ? STAGES : 0))
	useEffect(() => {
		if (n >= STAGES) return
		const next = () =>
			startTransition(() => setN((c) => Math.min(STAGES, c + 1)))
		const ric = window.requestIdleCallback
		if (ric) {
			const id = ric(next, { timeout: 120 })
			return () => window.cancelIdleCallback(id)
		}
		const id = setTimeout(next, 16)
		return () => clearTimeout(id)
	}, [n])
	return n
}

const Home = () => {
	const { t } = useLang()
	const { say } = useGuide()
	const shown = useStagedMount()
	// La lista y los eventos se piden cuando empiezan a montarse las secciones
	const ready = shown >= 1
	const firmas = useFirmas(ready)
	const onNew = useCallback(
		() => say("guide.newSig", "sorprendido", 3000),
		[say],
	)
	useFirmadoLive(onNew, ready)

	return (
		<>
			{shown >= 1 && (
				<>
					<Marquee count={firmas.data?.length} />
					<Intro />
				</>
			)}
			{shown >= 2 && <Steps />}
			{shown >= 3 && (
				<section className="sign" id="firmar" data-p>
					<header className="section-head" data-reveal>
						<span className="kicker mono">{t("form.kicker")}</span>
						<h2>
							{t("form.title")}{" "}
							<em className="serif">{t("form.titleItalic")}</em>
						</h2>
					</header>
					<SignForm firmas={firmas.data} />
				</section>
			)}
			{shown >= 4 && (
				<section className="book" id="libro">
					<header className="section-head" data-reveal>
						<span className="kicker mono">{t("list.kicker")}</span>
						<h2>
							{t("list.title")}{" "}
							<em className="serif">{t("list.titleItalic")}</em>
						</h2>
						<p className="book__sub mono">{t("list.subtitle")}</p>
					</header>
					<Near minHeight={720}>
						<SignatureList query={firmas} />
					</Near>
				</section>
			)}
			{shown >= 5 && <Contract />}
			{shown >= 6 && <Footer />}
		</>
	)
}

export default Home
