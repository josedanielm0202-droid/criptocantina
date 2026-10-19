import "@fontsource/patrick-hand/latin.css"
import "@fontsource/patrick-hand/latin-ext.css"
import { shortAddress } from "@stellar-scaffold/app-lib"
import { type UseQueryResult } from "@tanstack/react-query"
import {
	type PointerEvent as RPointerEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react"
import { type FirmaUI } from "../../hooks/useFirmas"
import { useInView } from "../../hooks/useInView"
import { useLang } from "../../hooks/useLang"
import { useWallet } from "../../hooks/useWallet"
import { accountUrl } from "../../lib/guestbook"
import { useGuide } from "./Guide"
import { Mascot } from "./Mascot"

/* ---------------------------------------------------------------------------
 * El libro de la Cantina: las firmas se muestran como un cuaderno rayado que
 * se hojea (flipbook). Las entradas van en orden cronológico, como un diario,
 * y el libro abre en la última página.
 * ------------------------------------------------------------------------- */

const LINES = 15 // renglones por página
const FONT_PX = 20
const FONT = `${FONT_PX}px "Patrick Hand"`
const FLIP_MS = 900

interface Entry {
	f: FirmaUI
	msg: string[]
}
type Page = { entries: Entry[]; n: number }

/** Parte un texto en renglones usando el ancho real de la letra. */
function wrap(text: string, width: number, ctx: CanvasRenderingContext2D) {
	const out: string[] = []
	for (const para of text.split(/\n/)) {
		let cur = ""
		for (const word of para.split(/\s+/).filter(Boolean)) {
			const tryLine = cur ? `${cur} ${word}` : word
			if (ctx.measureText(tryLine).width <= width) {
				cur = tryLine
				continue
			}
			if (cur) out.push(cur)
			// palabra más larga que el renglón: se corta por letras
			let w = word
			while (ctx.measureText(w).width > width) {
				let i = w.length
				while (i > 1 && ctx.measureText(w.slice(0, i)).width > width) i--
				out.push(w.slice(0, i))
				w = w.slice(i)
			}
			cur = w
		}
		if (cur) out.push(cur)
	}
	return out.length ? out : [""]
}

function paginate(list: FirmaUI[], width: number, ctx: CanvasRenderingContext2D) {
	const pages: Page[] = []
	let cur: Entry[] = []
	let used = 0
	for (const f of list) {
		const msg = wrap(f.mensaje, width, ctx).slice(0, LINES - 1)
		const need = 1 + msg.length + (used ? 1 : 0)
		if (used && used + need > LINES) {
			pages.push({ entries: cur, n: pages.length + 1 })
			cur = []
			used = 0
		}
		used += 1 + msg.length + (used ? 1 : 0)
		cur.push({ f, msg })
	}
	pages.push({ entries: cur, n: pages.length + 1 })
	return pages
}

function dateParts(fecha: bigint, lang: "es" | "en") {
	const d = new Date(Number(fecha) * 1000)
	const dd = String(d.getDate()).padStart(2, "0")
	const mm = String(d.getMonth() + 1).padStart(2, "0")
	const yy = String(d.getFullYear()).slice(2)
	const time = new Intl.DateTimeFormat(lang === "es" ? "es-CR" : "en-US", {
		hour: "numeric",
		minute: "2-digit",
	}).format(d)
	return { slot: lang === "es" ? [dd, mm, yy] : [mm, dd, yy], time }
}

/** Datos de prueba solo en desarrollo: `?mockFirmas=25` */
function useMock(): FirmaUI[] | null {
	return useMemo(() => {
		if (!import.meta.env.DEV) return null
		const n = new URLSearchParams(location.search).get("mockFirmas")
		if (n === null) return null
		const base = 1792000000
		const msgs = [
			"¡Pura vida, Cantina! Pasé a dejar mi firma desde Costa Rica.",
			"PRUEBA-1",
			"Qué buena onda este libro. Saludos desde Cartago, ¡nos vemos en la próxima Stellar Session!",
			"gm ☕",
			"Aquí estuvo Ana. Ñandú, pingüino, acción: probando tildes y eñes.",
			"Mensaje largo de prueba: ".padEnd(280, " lorem ipsum dolor sit amet"),
			"First time on Soroban, this was fun. Thanks for the workshop!",
		]
		const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
		const addr = (i: number) =>
			"G" + Array.from({ length: 55 }, (_, k) => A[(i * 7 + k * 13 + ((i * k) % 5)) % 32]).join("")
		return Array.from({ length: Number(n) }, (_, i) => ({
			autor: addr(i),
			mensaje: msgs[i % msgs.length],
			fecha: BigInt(base + i * 86400 * 2 + i * 3671),
		})).reverse()
	}, [])
}

export function SignatureList({ query }: { query: UseQueryResult<FirmaUI[]> }) {
	const { t, lang } = useLang()
	const { address } = useWallet()
	const guide = useGuide()
	const ref = useRef<HTMLDivElement>(null)
	const inView = useInView(ref, { threshold: 0.3 })
	const mock = useMock()
	const { isLoading: qLoading, isError, refetch, isFetching } = query
	const data = mock ?? query.data
	const isLoading = !mock && qLoading

	useEffect(() => {
		if (!inView || isLoading) return
		if (data && data.length === 0)
			guide.sayOnce("list-empty", "guide.empty", "sorprendido")
		else guide.sayOnce("list", "guide.list", "divertido")
	}, [inView, isLoading, data, guide])

	/* ---- medidas: modo de una o dos páginas y ancho útil del renglón ---- */
	const bookRef = useRef<HTMLDivElement>(null)
	const [dims, setDims] = useState({ single: false, textW: 380 })
	const [fontReady, setFontReady] = useState(false)
	useEffect(() => {
		let alive = true
		void document.fonts.load(FONT, "ñá").then(() => alive && setFontReady(true))
		return () => {
			alive = false
		}
	}, [])
	useLayoutEffect(() => {
		const el = bookRef.current
		if (!el) return
		const measure = () => {
			const single = window.matchMedia("(max-width: 760px)").matches
			const w = el.clientWidth
			const pageW = single ? w : w / 2
			const textW = Math.max(160, pageW - 2 * pagePad(pageW) - 16)
			setDims((d) =>
				d.single === single && Math.abs(d.textW - textW) < 1 ? d : { single, textW },
			)
		}
		measure()
		const ro = new ResizeObserver(measure)
		ro.observe(el)
		return () => ro.disconnect()
	}, [])

	const chrono = useMemo(
		() => (data ? [...data].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0)) : []),
		[data],
	)
	const pages = useMemo(() => {
		const ctx = document.createElement("canvas").getContext("2d")
		if (!ctx) return [{ entries: [], n: 1 }] as Page[]
		ctx.font = FONT
		return paginate(chrono, dims.textW, ctx)
		// fontReady: volver a medir cuando cargue la letra
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chrono, dims.textW, fontReady])

	/* ---- vistas: -1 = cerrado (portada); s >= 0 = pliego / página ---- */
	const per = dims.single ? 1 : 2
	const lastView = Math.max(0, Math.ceil(pages.length / per) - 1)
	const [view, setView] = useState(-1)
	const [flip, setFlip] = useState<null | { from: number; to: number; dir: 1 | -1 }>(null)
	const [angle, setAngle] = useState(0) // 0..180 grados de la hoja que gira
	const [anim, setAnim] = useState(false)
	const [fade, setFade] = useState(false)
	const reduced = useReducedMotion()
	const timer = useRef<number>(0)

	// si cambia la cantidad de páginas (nueva firma o cambio de tamaño), ajustar
	const prevPages = useRef(pages.length)
	useEffect(() => {
		if (view > lastView) setView(lastView)
		else if (view >= 0 && pages.length > prevPages.current) setView(lastView)
		prevPages.current = pages.length
	}, [pages.length, lastView, view])

	const finish = useCallback((to: number) => {
		setView(to)
		setFlip(null)
		setAnim(false)
		setAngle(0)
	}, [])

	const go = useCallback(
		(to: number) => {
			if (flip || to === view || to < -1 || to > lastView) return
			if (reduced) {
				setFade(true)
				window.clearTimeout(timer.current)
				timer.current = window.setTimeout(() => {
					setView(to)
					setFade(false)
				}, 220)
				return
			}
			const dir = to > view ? 1 : -1
			setFlip({ from: view, to, dir })
			setAnim(false)
			setAngle(dir === 1 ? 0 : 180)
			requestAnimationFrame(() =>
				requestAnimationFrame(() => {
					setAnim(true)
					setAngle(dir === 1 ? 180 : 0)
				}),
			)
			window.clearTimeout(timer.current)
			timer.current = window.setTimeout(() => finish(to), FLIP_MS + 40)
		},
		[flip, view, lastView, reduced, finish],
	)
	useEffect(() => () => window.clearTimeout(timer.current), [])

	const next = () => go(view === -1 ? lastView : view + 1)
	const prev = () => go(view === 0 ? -1 : view - 1)

	/* ---- arrastrar la esquina / deslizar en móvil ---- */
	const drag = useRef<null | { dir: 1 | -1; x0: number; w: number; to: number; p: number }>(null)
	const onDown = (e: RPointerEvent<HTMLDivElement>) => {
		if (flip || reduced || e.button !== 0) return
		if ((e.target as HTMLElement).closest("a,button")) return
		const el = bookRef.current
		if (!el) return
		const r = el.getBoundingClientRect()
		const onRight = dims.single || view === -1 ? true : e.clientX > r.left + r.width / 2
		const dir: 1 | -1 = onRight ? 1 : -1
		if (dims.single && view !== -1) {
			// en móvil: deslizar a la izquierda = siguiente, a la derecha = anterior
			drag.current = { dir: 1, x0: e.clientX, w: r.width, to: NaN, p: 0 }
		} else {
			const to = dir === 1 ? (view === -1 ? lastView : view + 1) : view === 0 ? -1 : view - 1
			if (to > lastView || to < -1) return
			drag.current = { dir, x0: e.clientX, w: r.width, to, p: 0 }
		}
		e.currentTarget.setPointerCapture(e.pointerId)
	}
	const onMove = (e: RPointerEvent<HTMLDivElement>) => {
		const d = drag.current
		if (!d) return
		const dx = e.clientX - d.x0
		if (Number.isNaN(d.to)) {
			if (Math.abs(dx) < 12) return
			const dir: 1 | -1 = dx < 0 ? 1 : -1
			const to = view + dir
			if (to > lastView || to < -1) {
				drag.current = null
				return
			}
			d.dir = dir
			d.to = to
		}
		const span = dims.single ? d.w : d.w * (view === -1 ? 0.5 : 1)
		const p = Math.min(1, Math.max(0, (d.dir === 1 ? -dx : dx) / span))
		if (p < 0.02 && !flip) return
		d.p = p
		if (!flip) setFlip({ from: view, to: d.to, dir: d.dir })
		setAnim(false)
		setAngle(d.dir === 1 ? p * 180 : 180 - p * 180)
	}
	const onUp = (e: RPointerEvent<HTMLDivElement>) => {
		const d = drag.current
		drag.current = null
		if (!d) return
		if (!flip) {
			// clic sin arrastrar: pasar página según el lado
			if (Math.abs(e.clientX - d.x0) < 6 && !Number.isNaN(d.to) && !dims.single) go(d.to)
			else if (dims.single && Math.abs(e.clientX - d.x0) < 6) {
				const r = bookRef.current?.getBoundingClientRect()
				if (r && e.clientX < r.left + r.width * 0.3) prev()
				else next()
			}
			return
		}
		const done = d.p > 0.3
		setAnim(true)
		const target = done === (d.dir === 1) ? 180 : 0
		setAngle(target)
		const ms = FLIP_MS * (done ? 1 - d.p : d.p) + 120
		window.clearTimeout(timer.current)
		timer.current = window.setTimeout(() => {
			if (done) finish(d.to)
			else {
				setFlip(null)
				setAnim(false)
				setAngle(0)
			}
		}, ms)
	}

	useEffect(() => {
		const el = ref.current
		if (!el) return
		const onKey = (e: KeyboardEvent) => {
			if (!el.contains(document.activeElement)) return
			if (e.key === "ArrowRight") next()
			if (e.key === "ArrowLeft") prev()
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	})

	/* ---- contenido de cada lado ---- */
	const pageAt = (i: number): ReactNode => {
		if (i < 0 || i >= pages.length) return <Paper blank />
		return (
			<Paper
				page={pages[i]}
				total={pages.length}
				lang={lang}
				t={t}
				me={address}
				state={isLoading ? "loading" : isError ? "error" : chrono.length === 0 ? "empty" : "ok"}
				onRetry={() => void refetch()}
			/>
		)
	}
	const sideOf = (v: number, side: "L" | "R"): ReactNode => {
		if (v === -1) return side === "R" ? <Cover t={t} count={chrono.length} /> : null
		if (dims.single) return side === "R" ? pageAt(v) : null
		return pageAt(side === "L" ? v * 2 : v * 2 + 1)
	}

	// qué se ve debajo de la hoja que gira
	let staticL: ReactNode, staticR: ReactNode, front: ReactNode, back: ReactNode
	if (flip) {
		const { from, to, dir } = flip
		if (dir === 1) {
			staticL = sideOf(from, "L")
			staticR = sideOf(to, "R")
			front = sideOf(from, "R")
			back = dims.single ? <Paper back /> : sideOf(to, "L") ?? <InsideCover />
		} else {
			staticL = sideOf(to, "L")
			staticR = sideOf(from, "R")
			front = sideOf(to, "R")
			back = dims.single ? <Paper back /> : sideOf(from, "L") ?? <InsideCover />
		}
		if (!dims.single) {
			if (dir === 1 && from === -1) staticL = null
			if (dir === -1 && to === -1) staticL = null
		}
	} else {
		staticL = sideOf(view, "L")
		staticR = sideOf(view, "R")
	}
	const closed = (flip ? (flip.dir === 1 ? angle < 90 && flip.from === -1 : angle < 90 && flip.to === -1) : view === -1)
	const showLeftBase = !dims.single && (staticL !== null || (flip && !closed))

	const counter =
		view === -1
			? t("list.cover")
			: dims.single || view * 2 + 2 > pages.length
				? t("list.pageOf", { a: dims.single ? view + 1 : view * 2 + 1, b: pages.length })
				: t("list.pagesOf", {
						a: view * 2 + 1,
						b: Math.min(view * 2 + 2, pages.length),
						c: pages.length,
					})

	return (
		<div className="flipbook" ref={ref} data-reveal>
			<div className="flipbook__bar mono">
				<span className="editor__live">
					<span className="live-dot" /> {t("list.live")}
				</span>
				<span className="flipbook__count">
					{chrono.length === 1 ? t("list.count1") : t("list.count", { n: chrono.length })}
				</span>
				<button
					type="button"
					className="editor__refresh mono"
					aria-label={t("list.refresh")}
					onClick={() => void refetch()}
					disabled={isFetching}
				>
					↻ <span className="hide-sm">{t("list.refresh")}</span>
				</button>
			</div>

			<div
				className={`fb ${dims.single ? "fb--single" : ""} ${closed && !dims.single ? "fb--closed" : ""} ${fade ? "fb--fade" : ""}`}
				tabIndex={0}
				role="region"
				aria-roledescription={t("list.bookRole")}
				aria-label={`${t("list.bookTitle")} · ${counter}`}
			>
				<div
					className="fb__book"
					ref={bookRef}
					onPointerDown={onDown}
					onPointerMove={onMove}
					onPointerUp={onUp}
					onPointerCancel={onUp}
				>
					{showLeftBase && <div className="fb__half fb__half--L">{staticL ?? <InsideCover />}</div>}
					<div className="fb__half fb__half--R">{staticR}</div>
					{!dims.single && !closed && <div className="fb__spine" aria-hidden />}
					{flip && (
						<div
							className={`fb__leaf ${anim ? "is-anim" : ""}`}
							style={{
								transform: `rotateY(${-angle}deg)`,
								["--a" as string]: String(angle / 180),
								transitionDuration: anim ? `${FLIP_MS}ms` : "0ms",
							}}
						>
							<div className="fb__face fb__face--front">{front}</div>
							<div className="fb__face fb__face--back">{back}</div>
						</div>
					)}
				</div>
			</div>

			<div className="flipbook__nav">
				<button
					type="button"
					className="fb-arrow"
					onClick={prev}
					disabled={view === -1 || !!flip}
					aria-label={t("list.prev")}
				>
					←
				</button>
				<span className="flipbook__pager mono" aria-live="polite">
					{counter}
				</span>
				<button
					type="button"
					className="fb-arrow"
					onClick={next}
					disabled={view === lastView || !!flip}
					aria-label={view === -1 ? t("list.open") : t("list.next")}
				>
					→
				</button>
			</div>
			<p className="flipbook__hint mono">{t("list.hint")}</p>
		</div>
	)
}

function pagePad(pageW: number) {
	return pageW < 420 ? 26 : 44
}

function useReducedMotion() {
	const [r, setR] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)
	useEffect(() => {
		const m = window.matchMedia("(prefers-reduced-motion: reduce)")
		const h = () => setR(m.matches)
		m.addEventListener("change", h)
		return () => m.removeEventListener("change", h)
	}, [])
	return r
}

type T = ReturnType<typeof useLang>["t"]

function Cover({ t, count }: { t: T; count: number }) {
	return (
		<div className="fb-cover">
			<div className="fb-cover__frame">
				<span className="fb-cover__kicker mono">Cripto Cantina · Testnet</span>
				<Mascot expression="neutral" size={92} className="fb-cover__mascot" />
				<h3 className="fb-cover__title">{t("list.bookTitle")}</h3>
				<p className="fb-cover__sub serif">{t("list.subtitle")}</p>
				<span className="fb-cover__count mono">
					{count === 1 ? t("list.count1") : t("list.count", { n: count })}
				</span>
				<span className="fb-cover__open mono">{t("list.openHint")} →</span>
			</div>
		</div>
	)
}

function InsideCover() {
	return <div className="fb-inside" />
}

function Paper(props: {
	page?: Page
	total?: number
	lang?: "es" | "en"
	t?: T
	me?: string
	state?: "loading" | "error" | "empty" | "ok"
	onRetry?: () => void
	blank?: boolean
	back?: boolean
}) {
	const { page, total, lang = "es", t, me, state, onRetry } = props
	const first = page?.entries[0]
	const slot = first ? dateParts(first.f.fecha, lang).slot : ["", "", ""]
	let body: ReactNode = null
	if (page && t) {
		if (state === "loading") body = <div className="hw-line hw-muted">{t("list.loading")}</div>
		else if (state === "error")
			body = (
				<div className="hw-line hw-err">
					{t("err.list")}{" "}
					<button type="button" className="hw-link" onClick={onRetry}>
						{t("err.retry")}
					</button>
				</div>
			)
		else if (state === "empty")
			body = (
				<>
					<div className="hw-line" />
					<div className="hw-line hw-empty">{t("list.empty")}</div>
				</>
			)
		else
			body = page.entries.map((e, i) => {
				const { slot: s, time } = dateParts(e.f.fecha, lang)
				const mine = e.f.autor === me
				return (
					<article key={`${e.f.autor}-${String(e.f.fecha)}`} className={`hw-entry ${mine ? "is-me" : ""}`}>
						{i > 0 && <div className="hw-line" aria-hidden />}
						<div className="hw-line hw-head">
							<span className="hw-label">{t("list.addr")}</span>{" "}
							<a href={accountUrl(e.f.autor)} target="_blank" rel="noreferrer" title={e.f.autor} className="hw-addr">
								{shortAddress(e.f.autor)}
							</a>
							{mine && <span className="hw-you">({t("list.you")})</span>}
							<time className="hw-date">
								{s.join("/")} · {time}
							</time>
						</div>
						{e.msg.map((l, j) => (
							<div key={j} className="hw-line hw-msg">
								{l}
							</div>
						))}
					</article>
				)
			})
	}
	return (
		<div className={`paper ${props.back ? "paper--back" : ""}`}>
			<div className="paper__head">
				<span className="paper__slot">
					<i>{slot[0]}</i>/<i>{slot[1]}</i>/<i>{slot[2]}</i>
				</span>
			</div>
			<div className="paper__lines">{body}</div>
			<div className="paper__foot">{page && total ? <span>{page.n}</span> : null}</div>
		</div>
	)
}
