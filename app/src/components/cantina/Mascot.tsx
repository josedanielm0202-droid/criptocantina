import { memo, useEffect, useRef } from "react"

export type Expression =
	| "neutral"
	| "triste"
	| "enojado"
	| "emocionado"
	| "sorprendido"
	| "divertido"
	| "determinado"
	| "nervioso"

export const EXPRESSIONS: Expression[] = [
	"neutral",
	"triste",
	"enojado",
	"emocionado",
	"sorprendido",
	"divertido",
	"determinado",
	"nervioso",
]

const BLUE = "#4285F4"
const DARK = "#2A5FC4"
const EYE = "#FFFFFF"

/** Silueta: huevo redondeado (brazos y pies van aparte para que se lean como extremidades). */
export const BODY =
	"M100 14 C144 14 170 80 170 134 C170 174 140 198 100 198 C60 198 30 174 30 134 C30 80 56 14 100 14 Z"

const star = (cx: number, cy: number, r: number) => {
	const pts: string[] = []
	for (let i = 0; i < 10; i++) {
		const rad = i % 2 === 0 ? r : r * 0.45
		const a = -Math.PI / 2 + (i * Math.PI) / 5
		pts.push(
			`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`,
		)
	}
	return pts.join(" ")
}

const spiral = (cx: number, cy: number, turns = 2.2, r = 11) => {
	let d = ""
	const steps = 60
	for (let i = 0; i <= steps; i++) {
		const t = i / steps
		const a = t * turns * Math.PI * 2
		const rr = 1.5 + t * r
		const x = cx + rr * Math.cos(a)
		const y = cy + rr * Math.sin(a)
		d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `
	}
	return d
}

/** Extremidad con contorno oscuro para que se distinga del cuerpo. */
const Limb = ({ d, w = 17 }: { d: string; w?: number }) => (
	<>
		<path d={d} stroke={DARK} strokeWidth={w + 6} fill="none" strokeLinecap="round" />
		<path d={d} stroke={BLUE} strokeWidth={w} fill="none" strokeLinecap="round" />
	</>
)

const Hand = ({ cx, cy, r = 10 }: { cx: number; cy: number; r?: number }) => (
	<circle cx={cx} cy={cy} r={r} fill={BLUE} stroke={DARK} strokeWidth="3" />
)

const Foot = ({ cx, dark = false }: { cx: number; dark?: boolean }) => (
	<ellipse
		cx={cx}
		cy="203"
		rx="23"
		ry="12"
		fill={dark ? DARK : BLUE}
		stroke={DARK}
		strokeWidth="3"
	/>
)

const HangL = () => <Limb d="M50 124 C40 140 32 154 26 170" />
const HangR = () => <Limb d="M150 124 C160 140 168 154 174 170" />

/** Brazos en la cadera (enojado / determinado). */
const HipArm = ({ side }: { side: "l" | "r" }) => (
	<g transform={side === "r" ? "translate(207 0) scale(-1 1)" : "translate(-7 0)"}>
		<path
			d="M44 116 C24 112 12 126 12 142 C12 156 20 166 34 168 C40 168 42 162 38 158 C30 154 28 146 32 140 C36 136 40 134 44 132 Z"
			fill={BLUE}
			stroke={DARK}
			strokeWidth="3"
			strokeLinejoin="round"
		/>
		<Hand cx={40} cy={160} r={11} />
	</g>
)

/** Capa de atrás: brazos y pies que salen detrás del cuerpo. */
const Arms = ({ e }: { e: Expression }) => {
	switch (e) {
		case "triste":
			return null
		case "enojado":
		case "determinado":
			return (
				<>
					<Foot cx={70} />
					<Foot cx={130} />
					<HipArm side="l" />
					<HipArm side="r" />
				</>
			)
		case "emocionado":
			return (
				<>
					<Foot cx={136} />
					<Limb d="M58 96 C46 76 38 58 32 40" w={18} />
					<Limb d="M142 96 C154 76 162 58 168 40" w={18} />
					<Hand cx={31} cy={36} r={12} />
					<Hand cx={169} cy={36} r={12} />
				</>
			)
		case "sorprendido":
			return <Foot cx={70} />
		case "divertido":
			return (
				<>
					<Foot cx={70} />
					<Foot cx={130} />
					<HangL />
					<Limb d="M150 140 C160 138 168 134 176 130" w={16} />
				</>
			)
		case "nervioso":
			return (
				<>
					<Foot cx={70} />
					<Foot cx={130} />
					<HangR />
				</>
			)
		default:
			return (
				<>
					<Foot cx={70} />
					<Foot cx={130} />
					<HangL />
					<HangR />
				</>
			)
	}
}

/** Detalles en primer plano (brazos por delante, pies oscuros, gotas…). */
const Front = ({ e }: { e: Expression }) => {
	switch (e) {
		case "triste":
			return (
				<>
					<ellipse cx="44" cy="196" rx="21" ry="14" fill={DARK} transform="rotate(-35 44 196)" />
					<ellipse cx="156" cy="196" rx="21" ry="14" fill={DARK} transform="rotate(35 156 196)" />
					{/* manos sobre las rodillas */}
					<Limb d="M48 124 C50 148 52 166 54 180" w={15} />
					<Limb d="M152 124 C150 148 148 166 146 180" w={15} />
					<Hand cx={54} cy={184} />
					<Hand cx={146} cy={184} />
				</>
			)
		case "enojado":
			return <ellipse cx="62" cy="204" rx="22" ry="12" fill={DARK} transform="rotate(12 62 204)" />
		case "emocionado":
			return <ellipse cx="54" cy="190" rx="16" ry="21" fill={DARK} transform="rotate(-30 54 190)" />
		case "sorprendido":
			return (
				<>
					{/* manitas en las mejillas */}
					<Limb d="M42 178 C42 162 50 150 62 142" w={15} />
					<Limb d="M158 178 C158 162 150 150 138 142" w={15} />
					<Hand cx={64} cy={140} />
					<Hand cx={136} cy={140} />
					<ellipse cx="146" cy="200" rx="21" ry="14" fill={DARK} transform="rotate(-35 146 200)" />
				</>
			)
		case "divertido":
			return (
				<g stroke={DARK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
					{/* pulgar arriba: el pulgar sale del borde del puño, junto al cuerpo */}
					<rect x="167" y="86" width="13" height="34" rx="6.5" fill={BLUE} />
					<rect x="166" y="112" width="31" height="32" rx="11" fill={BLUE} />
					<path d="M182 121 H196" fill="none" />
					<path d="M182 129 H196" fill="none" />
					<path d="M182 137 H195" fill="none" />
				</g>
			)
		case "determinado":
			return (
				<g stroke={EYE} strokeWidth="2.2" strokeLinecap="round" opacity="0.85">
					<path d="M58 76 L52 70" />
					<path d="M62 72 L58 64" />
					<path d="M142 76 L148 70" />
					<path d="M138 72 L142 64" />
				</g>
			)
		case "nervioso":
			return (
				<>
					{/* mano rascando la cabeza */}
					<Limb d="M42 140 C26 112 30 70 54 46 C60 40 66 36 72 34" w={17} />
					<Hand cx={76} cy={32} r={12} />
					<g stroke={DARK} strokeWidth="2.5" strokeLinecap="round">
						<path d="M88 18 L94 12" />
						<path d="M92 26 L100 22" />
					</g>
					{/* gota de sudor */}
					<path
						d="M148 98 C142 108 140 114 140 118 A8 8 0 0 0 156 118 C156 114 154 108 148 98 Z"
						fill={EYE}
					/>
				</>
			)
		default:
			return null
	}
}

const Eyes = ({ e }: { e: Expression }) => {
	switch (e) {
		case "triste":
			return (
				<g fill={EYE}>
					{/* ojos caídos: borde superior inclinado hacia afuera */}
					<path d="M66 100 Q76 86 92 84 L92 116 A13 13 0 0 1 66 116 Z" />
					<path d="M134 100 Q124 86 108 84 L108 116 A13 13 0 0 0 134 116 Z" />
				</g>
			)
		case "enojado":
			return (
				<g
					stroke={EYE}
					strokeWidth="9"
					strokeLinecap="round"
					strokeLinejoin="round"
					fill="none"
				>
					<path d="M68 92 L88 104 L68 114" />
					<path d="M132 92 L112 104 L132 114" />
				</g>
			)
		case "emocionado":
			return (
				<g fill={EYE}>
					<polygon
						points={star(78, 102, 16)}
						strokeLinejoin="round"
						stroke={EYE}
						strokeWidth="2"
					/>
					<polygon
						points={star(122, 102, 16)}
						strokeLinejoin="round"
						stroke={EYE}
						strokeWidth="2"
					/>
				</g>
			)
		case "sorprendido":
			return (
				<g fill={EYE}>
					<ellipse cx="76" cy="100" rx="18" ry="22" />
					<ellipse cx="124" cy="100" rx="18" ry="22" />
				</g>
			)
		case "divertido":
			return (
				<g fill={EYE}>
					<rect x="68" y="80" width="22" height="44" rx="11" />
					<path
						d="M106 106 Q120 90 134 106"
						stroke={EYE}
						strokeWidth="8"
						fill="none"
						strokeLinecap="round"
					/>
				</g>
			)
		case "determinado":
			return (
				<g fill={EYE}>
					<path
						d="M68 90 L92 102 L92 114 A12 12 0 0 1 68 114 Z"
						strokeLinejoin="round"
					/>
					<path
						d="M132 90 L108 102 L108 114 A12 12 0 0 0 132 114 Z"
						strokeLinejoin="round"
					/>
				</g>
			)
		case "nervioso":
			return (
				<g stroke={EYE} strokeWidth="4" fill="none" strokeLinecap="round">
					<path d={spiral(80, 104)} />
					<path d={spiral(118, 104)} />
				</g>
			)
		default:
			return (
				<g fill={EYE}>
					<rect x="68" y="80" width="22" height="44" rx="11" />
					<rect x="110" y="80" width="22" height="44" rx="11" />
				</g>
			)
	}
}

/**
 * Un solo IntersectionObserver para todos los personajes: los que no se ven
 * reciben `data-off` y sus animaciones quedan en pausa (ver cantina.css).
 */
let visIO: IntersectionObserver | null = null
const getVisIO = () =>
	(visIO ??= new IntersectionObserver(
		(entries) =>
			entries.forEach((e) =>
				// atributo (no clase): React reescribe className al cambiar la expresión
				e.target.toggleAttribute("data-off", !e.isIntersecting),
			),
		{ rootMargin: "120px" },
	))
const watchVisibility = (el: Element) => {
	if (typeof IntersectionObserver !== "undefined") getVisIO().observe(el)
}
const unwatchVisibility = (el: Element) => visIO?.unobserve(el)

export interface MascotProps {
	expression?: Expression
	size?: number | string
	/** Animación de reposo (flotar + parpadear). */
	idle?: boolean
	className?: string
	title?: string
}

/** Centro de los ojos (unidades del viewBox 200×220) por expresión: el
 * parpadeo/giro de los ojos rota y escala alrededor de este punto. */
const EYE_CENTER: Record<Expression, [number, number]> = {
	neutral: [100, 102],
	triste: [100, 106.5],
	enojado: [100, 103],
	emocionado: [100, 100.45],
	sorprendido: [100, 100],
	divertido: [101, 102],
	determinado: [100, 108],
	nervioso: [100.25, 104.8],
}

const VB = "0 0 200 220"

/**
 * El personaje guía de la Cripto Cantina, dibujado en SVG para que se vea
 * nítido a cualquier tamaño.
 *
 * Va en capas (sombra · cuerpo · ojos · detalles) para que cada parte que se
 * anima sea su propia caja HTML: así flotar, parpadear, girar los ojos, etc.
 * corren en la GPU (compositor) y no obligan a repintar el SVG en cada frame.
 */
export const Mascot = memo(function Mascot({
	expression = "neutral",
	size = 120,
	idle = true,
	className = "",
	title,
}: MascotProps) {
	const ref = useRef<HTMLSpanElement>(null)
	useEffect(() => {
		const el = ref.current
		if (!el) return
		watchVisibility(el)
		return () => unwatchVisibility(el)
	}, [])
	const [ex, ey] = EYE_CENTER[expression]
	return (
		<span
			ref={ref}
			className={`mascot ${idle ? "mascot--idle" : ""} mascot--${expression} ${className}`}
			style={{
				display: "inline-block",
				width: size,
				height: typeof size === "number" ? size * 1.1 : undefined,
			}}
			role={title ? "img" : undefined}
			aria-label={title}
			aria-hidden={title ? undefined : true}
		>
			<span className="mascot__bob">
				<svg className="mascot__shadow" viewBox={VB}>
					<ellipse cx="100" cy="216" rx="64" ry="5" fill="#000" />
				</svg>
				<span className="mascot__body" key={expression}>
					<svg viewBox={VB}>
						<defs>
							<radialGradient id="mascot-shine" cx="0.38" cy="0.28" r="0.75">
								<stop offset="0" stopColor="#FFFFFF" stopOpacity="0.1" />
								<stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" />
							</radialGradient>
						</defs>
						<Arms e={expression} />
						<path d={BODY} fill={BLUE} stroke={DARK} strokeWidth="3" />
						<path d={BODY} fill="url(#mascot-shine)" />
					</svg>
					{/* La mirada sigue al mouse vía las variables CSS --lx / --ly */}
					<span className="mascot__look">
						<svg
							className="mascot__eyes"
							viewBox={VB}
							style={{ transformOrigin: `${ex / 2}% ${ey / 2.2}%` }}
						>
							<Eyes e={expression} />
						</svg>
					</span>
					<svg viewBox={VB}>
						<Front e={expression} />
					</svg>
				</span>
			</span>
		</span>
	)
})

export default Mascot
