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

/** Silueta: huevo redondeado con aletitas abajo a los lados. */
const BODY =
	"M100 12 C136 12 160 62 168 118 C172 146 178 164 190 178 C194 183 191 189 184 188 C177 187 171 185 166 183 C160 196 147 204 133 206 C131 212 121 214 113 211 C105 209 95 209 87 211 C79 214 69 212 67 206 C53 204 40 196 34 183 C29 185 23 187 16 188 C9 189 6 183 10 178 C22 164 28 146 32 118 C40 62 64 12 100 12 Z"

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

/** Brazos en la cadera (enojado / determinado). */
const HipArm = ({ side }: { side: "l" | "r" }) => (
	<path
		transform={side === "r" ? "translate(200 0) scale(-1 1)" : undefined}
		d="M36 118 C22 116 10 126 10 140 C10 156 18 168 32 170 C38 170 40 164 36 160 C28 156 26 146 30 140 C34 136 38 134 40 132 Z"
		fill={BLUE}
	/>
)

const Arms = ({ e }: { e: Expression }) => {
	switch (e) {
		case "enojado":
			return (
				<>
					<HipArm side="l" />
					<HipArm side="r" />
				</>
			)
		case "determinado":
			return (
				<>
					<HipArm side="l" />
					<HipArm side="r" />
				</>
			)
		case "emocionado":
			return (
				<g stroke={BLUE} strokeWidth="22" strokeLinecap="round" fill="none">
					<path d="M54 92 C42 74 34 56 30 38" />
					<path d="M146 92 C158 74 166 56 170 38" />
				</g>
			)
		case "divertido":
			return (
				<path
					d="M150 142 C160 140 168 136 172 130"
					stroke={BLUE}
					strokeWidth="20"
					strokeLinecap="round"
					fill="none"
				/>
			)
		default:
			return null
	}
}

/** Detalles en primer plano (brazos dibujados, pies oscuros, gotas…). */
const Front = ({ e }: { e: Expression }) => {
	switch (e) {
		case "triste":
			return (
				<>
					<path
						d="M40 118 C46 152 62 176 88 190"
						stroke={DARK}
						strokeWidth="3"
						fill="none"
						strokeLinecap="round"
					/>
					<path
						d="M160 118 C154 152 138 176 112 190"
						stroke={DARK}
						strokeWidth="3"
						fill="none"
						strokeLinecap="round"
					/>
					<ellipse
						cx="36"
						cy="194"
						rx="19"
						ry="14"
						fill={DARK}
						transform="rotate(-35 36 194)"
					/>
					<ellipse
						cx="164"
						cy="194"
						rx="19"
						ry="14"
						fill={DARK}
						transform="rotate(35 164 194)"
					/>
				</>
			)
		case "enojado":
			return (
				<ellipse
					cx="58"
					cy="200"
					rx="19"
					ry="11"
					fill={DARK}
					transform="rotate(12 58 200)"
				/>
			)
		case "emocionado":
			return (
				<ellipse
					cx="40"
					cy="176"
					rx="16"
					ry="20"
					fill={DARK}
					transform="rotate(-30 40 176)"
				/>
			)
		case "sorprendido":
			return (
				<>
					{/* manitas en las mejillas */}
					<path
						d="M36 158 C50 166 66 160 76 144"
						stroke={DARK}
						strokeWidth="3"
						fill="none"
						strokeLinecap="round"
					/>
					<path
						d="M164 158 C150 166 134 160 124 144"
						stroke={DARK}
						strokeWidth="3"
						fill="none"
						strokeLinecap="round"
					/>
					<ellipse
						cx="166"
						cy="192"
						rx="20"
						ry="14"
						fill={DARK}
						transform="rotate(-35 166 192)"
					/>
				</>
			)
		case "divertido":
			return (
				<g>
					{/* pulgar arriba: puño cerrado con dedos doblados visibles */}
					<g stroke={DARK} strokeWidth="2.4" strokeLinejoin="round" fill={BLUE}>
						<rect
							x="159"
							y="80"
							width="17"
							height="36"
							rx="8.5"
							transform="rotate(-18 167 114)"
						/>
						<rect x="156" y="108" width="26" height="46" rx="10" />
						<rect x="170" y="109" width="27" height="12" rx="6" />
						<rect x="170" y="120" width="27" height="12" rx="6" />
						<rect x="170" y="131" width="26" height="12" rx="6" />
						<rect x="170" y="142" width="23" height="12" rx="6" />
					</g>
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
					{/* mano en la cabeza */}
					<path
						d="M36 126 C24 100 30 62 56 40 C64 33 72 30 80 34"
						stroke={DARK}
						strokeWidth="24"
						fill="none"
						strokeLinecap="round"
					/>
					<path
						d="M36 126 C24 100 30 62 56 40 C64 33 72 30 80 34"
						stroke={BLUE}
						strokeWidth="19"
						fill="none"
						strokeLinecap="round"
					/>
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
					<ellipse cx="100" cy="214" rx="62" ry="5" fill="#000" />
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
						<path d={BODY} fill={BLUE} />
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
