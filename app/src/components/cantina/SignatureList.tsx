import "@fontsource/patrick-hand/latin.css"
import "@fontsource/patrick-hand/latin-ext.css"
import "@fontsource/cinzel/latin-500.css"
import "@fontsource/cinzel/latin-700.css"
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
import { BODY } from "./Mascot"

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

function paginate(
	list: FirmaUI[],
	width: number,
	ctx: CanvasRenderingContext2D,
) {
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
			"G" +
			Array.from(
				{ length: 55 },
				(_, k) => A[(i * 7 + k * 13 + ((i * k) % 5)) % 32],
			).join("")
		return Array.from({ length: Number(n) }, (_, i) => ({
			autor: addr(i),
			mensaje: msgs[i % msgs.length] ?? "",
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
				d.single === single && Math.abs(d.textW - textW) < 1
					? d
					: { single, textW },
			)
		}
		measure()
		const ro = new ResizeObserver(measure)
		ro.observe(el)
		return () => ro.disconnect()
	}, [])

	const chrono = useMemo(
		() =>
			data
				? [...data].sort((a, b) =>
						a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0,
					)
				: [],
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
	// En dos páginas el pliego 0 es [guarda | pág. 1] y luego [2|3], [4|5]…:
	// así, al abrir la tapa, su reverso (la guarda) cae a la izquierda y la
	// primera página queda a la derecha, como en un libro de verdad.
	const lastView = dims.single
		? Math.max(0, pages.length - 1)
		: Math.max(0, Math.ceil((pages.length + 1) / 2) - 1)
	const [view, setView] = useState(-1)
	const [flip, setFlip] = useState<null | {
		from: number
		to: number
		dir: 1 | -1
	}>(null)
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

	// abrir la tapa lleva al primer pliego (guarda | pág. 1), como un libro
	const next = () => go(view + 1)
	const prev = () => go(view === 0 ? -1 : view - 1)

	/* ---- arrastrar la esquina / deslizar en móvil ---- */
	const drag = useRef<null | {
		dir: 1 | -1
		x0: number
		w: number
		to: number
		p: number
	}>(null)
	const onDown = (e: RPointerEvent<HTMLDivElement>) => {
		if (flip || reduced || e.button !== 0) return
		if ((e.target as HTMLElement).closest("a,button")) return
		const el = bookRef.current
		if (!el) return
		const r = el.getBoundingClientRect()
		const onRight =
			dims.single || view === -1 ? true : e.clientX > r.left + r.width / 2
		const dir: 1 | -1 = onRight ? 1 : -1
		if (dims.single && view !== -1) {
			// en móvil: deslizar a la izquierda = siguiente, a la derecha = anterior
			drag.current = { dir: 1, x0: e.clientX, w: r.width, to: NaN, p: 0 }
		} else {
			const to = dir === 1 ? view + 1 : view - 1
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
			if (Math.abs(e.clientX - d.x0) < 6 && !Number.isNaN(d.to) && !dims.single)
				go(d.to)
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
				state={
					isLoading
						? "loading"
						: isError
							? "error"
							: chrono.length === 0
								? "empty"
								: "ok"
				}
				onRetry={() => void refetch()}
			/>
		)
	}
	const sideOf = (v: number, side: "L" | "R"): ReactNode => {
		if (v === -1)
			return side === "R" ? <Cover t={t} count={chrono.length} /> : null
		if (dims.single) return side === "R" ? pageAt(v) : null
		if (side === "L") return v === 0 ? <InsideCover /> : pageAt(v * 2 - 1)
		return pageAt(v * 2)
	}

	// qué se ve debajo de la hoja que gira
	let staticL: ReactNode, staticR: ReactNode, front: ReactNode, back: ReactNode
	if (flip) {
		const { from, to, dir } = flip
		if (dir === 1) {
			staticL = sideOf(from, "L")
			staticR = sideOf(to, "R")
			front = sideOf(from, "R")
			back = dims.single ? (
				from === -1 ? (
					<InsideCover />
				) : (
					<Paper back />
				)
			) : (
				sideOf(to, "L")
			)
		} else {
			staticL = sideOf(to, "L")
			staticR = sideOf(from, "R")
			front = sideOf(to, "R")
			back = dims.single ? (
				to === -1 ? (
					<InsideCover />
				) : (
					<Paper back />
				)
			) : (
				sideOf(from, "L")
			)
		}
		if (!dims.single) {
			if (dir === 1 && from === -1) staticL = null
			if (dir === -1 && to === -1) staticL = null
		}
	} else {
		staticL = sideOf(view, "L")
		staticR = sideOf(view, "R")
	}
	const closed = flip
		? flip.dir === 1
			? angle < 90 && flip.from === -1
			: angle < 90 && flip.to === -1
		: view === -1
	// Mientras gira la tapa no hay nada debajo a la izquierda: solo la hoja.
	const showLeftBase = !dims.single && staticL != null
	// El libro cerrado se corre un cuarto a la izquierda para quedar centrado.
	// Al abrir o cerrar la tapa ese corrimiento sigue al ángulo de la hoja
	// (misma duración y curva) en vez de saltar a mitad del giro.
	const coverFlip =
		!!flip && !dims.single && (flip.from === -1 || flip.to === -1)
	const shift = dims.single
		? 0
		: coverFlip
			? -25 * (1 - angle / 180)
			: view === -1
				? -25
				: 0

	const counter =
		view === -1
			? t("list.cover")
			: dims.single || view === 0 || view * 2 + 1 > pages.length
				? t("list.pageOf", {
						a: dims.single ? view + 1 : Math.max(1, view * 2),
						b: pages.length,
					})
				: t("list.pagesOf", { a: view * 2, b: view * 2 + 1, c: pages.length })

	return (
		<div className="flipbook" ref={ref} data-reveal>
			<div className="flipbook__bar mono">
				<span className="editor__live">
					<span className="live-dot" /> {t("list.live")}
				</span>
				<span className="flipbook__count">
					{chrono.length === 1
						? t("list.count1")
						: t("list.count", { n: chrono.length })}
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
					style={{
						transform: `translateX(${shift}%)`,
						transitionDuration: coverFlip && !anim ? "0ms" : `${FLIP_MS}ms`,
					}}
					onPointerDown={onDown}
					onPointerMove={onMove}
					onPointerUp={onUp}
					onPointerCancel={onUp}
				>
					{showLeftBase && (
						<div className="fb__half fb__half--L">
							{staticL ?? <InsideCover />}
						</div>
					)}
					<div className="fb__half fb__half--R">{staticR}</div>
					{!dims.single && !closed && <div className="fb__spine" aria-hidden />}
					{flip && (
						<div
							className={`fb__leaf ${anim ? "is-anim" : ""}`}
							style={{
								// translateZ fuera del giro: la hoja va 1px por delante de
								// las páginas fijas y no se "funde" con ellas en 0° / 180°
								transform: `translateZ(1px) rotateY(${-angle}deg)`,
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
	const [r, setR] = useState(
		() => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
	)
	useEffect(() => {
		const m = window.matchMedia("(prefers-reduced-motion: reduce)")
		const h = () => setR(m.matches)
		m.addEventListener("change", h)
		return () => m.removeEventListener("change", h)
	}, [])
	return r
}

type T = ReturnType<typeof useLang>["t"]

/* ---- Portada de tela azul con filetes dorados (ornamentos propios en SVG) ---- */

/** Degradé dorado compartido por los SVG de la tapa (mismo id = misma definición). */
const GoldDefs = () => (
	<defs>
		<linearGradient id="fb-gold" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stopColor="#f6e3a4" />
			<stop offset="0.35" stopColor="#d4ac55" />
			<stop offset="0.6" stopColor="#9c7630" />
			<stop offset="1" stopColor="#e9c977" />
		</linearGradient>
	</defs>
)

/** Esquina modernista: filete curvo, voluta y dos hojitas. Se refleja por CSS. */
function Corner({
	pos,
	muted,
}: {
	pos: "tl" | "tr" | "bl" | "br"
	muted?: boolean
}) {
	return (
		<svg
			className={`fb-orn fb-orn--${pos} ${muted ? "fb-orn--muted" : ""}`}
			viewBox="0 0 96 96"
			aria-hidden
		>
			<g
				fill="none"
				stroke={muted ? "currentColor" : "#d6b062"}
				strokeLinecap="round"
			>
				<path d="M6 94 V30 C6 16 16 6 30 6 H94" strokeWidth="1.6" />
				<path d="M15 94 V40 C15 26 26 15 40 15 H94" strokeWidth="0.8" />
				<path d="M24 62 C24 38 38 24 62 24" strokeWidth="1.2" />
				<path
					d="M30 30 C38 22 50 26 47 35 C45 41 37 40 38 34"
					strokeWidth="1.3"
				/>
				<path d="M62 24 C68 18 78 17 86 21" strokeWidth="1" />
				<path d="M24 62 C18 68 17 78 21 86" strokeWidth="1" />
			</g>
			<g fill={muted ? "currentColor" : "#d6b062"}>
				<path d="M66 15 C72 8 82 8 88 13 C81 16 73 17 66 15 Z" />
				<path d="M15 66 C8 72 8 82 13 88 C16 81 17 73 15 66 Z" />
				<circle cx="30" cy="30" r="2.2" />
			</g>
		</svg>
	)
}

/** Remate central simétrico (arriba / abajo del título). */
function Flourish({
	className = "",
	muted,
}: {
	className?: string
	muted?: boolean
}) {
	const half =
		"M4 14 C22 14 30 6 44 8 C54 9 56 19 49 21 C44 22 42 16 47 14 C56 12 64 14 70 14"
	return (
		<svg
			className={`fb-flourish ${className}`}
			viewBox="0 0 160 28"
			aria-hidden
		>
			<g
				fill="none"
				stroke={muted ? "currentColor" : "#d6b062"}
				strokeWidth="1.2"
				strokeLinecap="round"
			>
				<path d={half} />
				<path d={half} transform="translate(160 0) scale(-1 1)" />
			</g>
			<path
				d="M80 6 L87 14 L80 22 L73 14 Z"
				fill={muted ? "currentColor" : "#d6b062"}
			/>
		</svg>
	)
}

/** La mascota "grabada" en la tela: solo trazo dorado, relleno apenas más
 *  oscuro y un bajorrelieve hecho con trazos desplazados (sin filtros). */
function EngravedMascot() {
	return (
		<svg className="fb-cover__seal" viewBox="-20 -14 240 248" aria-hidden>
			<GoldDefs />
			<defs>
				<clipPath id="fb-seal-clip">
					<path d={BODY} />
				</clipPath>
			</defs>
			{/* medallón */}
			<circle
				cx="100"
				cy="110"
				r="118"
				fill="none"
				stroke="url(#fb-gold)"
				strokeWidth="1.4"
			/>
			<circle
				cx="100"
				cy="110"
				r="111"
				fill="none"
				stroke="url(#fb-gold)"
				strokeWidth="0.6"
				opacity="0.7"
			/>
			{/* hundido: relleno oscuro + sombra interior arriba-izq y luz abajo-der */}
			<path d={BODY} fill="#0a1226" opacity="0.55" />
			<g clipPath="url(#fb-seal-clip)" fill="none">
				<path
					d={BODY}
					stroke="#02050d"
					strokeWidth="9"
					opacity="0.55"
					transform="translate(3 4)"
				/>
				<path
					d={BODY}
					stroke="#f3dc9a"
					strokeWidth="2"
					opacity="0.18"
					transform="translate(-2 -2)"
				/>
			</g>
			<path
				d={BODY}
				fill="none"
				stroke="url(#fb-gold)"
				strokeWidth="3.2"
				strokeLinejoin="round"
			/>
			<g fill="#0a1226" stroke="url(#fb-gold)" strokeWidth="2.6">
				<rect x="69" y="81" width="20" height="42" rx="10" />
				<rect x="111" y="81" width="20" height="42" rx="10" />
			</g>
			<path
				d="M58 60 C66 44 80 36 92 34"
				fill="none"
				stroke="#f6e3a4"
				strokeWidth="1.4"
				strokeLinecap="round"
				opacity="0.5"
			/>
		</svg>
	)
}

function Cover({ t, count }: { t: T; count: number }) {
	return (
		<div className="fb-cover">
			<div className="fb-cover__frame">
				<Corner pos="tl" />
				<Corner pos="tr" />
				<Corner pos="bl" />
				<Corner pos="br" />
				<span className="fb-cover__kicker">Cripto Cantina · Testnet</span>
				<Flourish className="fb-flourish--top" />
				<EngravedMascot />
				<h3 className="fb-cover__title">{t("list.bookTitle")}</h3>
				<p className="fb-cover__sub">{t("list.subtitle")}</p>
				<Flourish className="fb-flourish--bot" />
				<span className="fb-cover__count">
					{count === 1 ? t("list.count1") : t("list.count", { n: count })}
				</span>
				<span className="fb-cover__open">{t("list.openHint")} →</span>
			</div>
		</div>
	)
}

/** Guarda (reverso de la tapa): papel crema con un filete dorado muy tenue. */
function InsideCover() {
	return (
		<div className="fb-inside">
			<Corner pos="tl" muted />
			<Corner pos="tr" muted />
			<Corner pos="bl" muted />
			<Corner pos="br" muted />
			<Flourish className="fb-inside__mark" muted />
		</div>
	)
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
		if (state === "loading")
			body = <div className="hw-line hw-muted">{t("list.loading")}</div>
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
					<article
						key={`${e.f.autor}-${String(e.f.fecha)}`}
						className={`hw-entry ${mine ? "is-me" : ""}`}
					>
						{i > 0 && <div className="hw-line" aria-hidden />}
						<div className="hw-line hw-head">
							<span className="hw-label">{t("list.addr")}</span>{" "}
							<a
								href={accountUrl(e.f.autor)}
								target="_blank"
								rel="noreferrer"
								title={e.f.autor}
								className="hw-addr"
							>
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
			<div className="paper__foot">
				{page && total ? <span>{page.n}</span> : null}
			</div>
		</div>
	)
}
