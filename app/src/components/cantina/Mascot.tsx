import { memo } from "react"

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
				<g fill={BLUE}>
					<rect x="150" y="112" width="40" height="28" rx="13" />
					<rect x="168" y="90" width="14" height="32" rx="7" />
				</g>
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
						d="M44 128 C52 160 70 182 92 192"
						stroke={DARK}
						strokeWidth="3.5"
						fill="none"
						strokeLinecap="round"
					/>
					<path
						d="M156 128 C148 160 130 182 108 192"
						stroke={DARK}
						strokeWidth="3.5"
						fill="none"
						strokeLinecap="round"
					/>
					<ellipse
						cx="40"
						cy="196"
						rx="17"
						ry="12"
						fill={DARK}
						transform="rotate(-25 40 196)"
					/>
					<ellipse
						cx="160"
						cy="196"
						rx="17"
						ry="12"
						fill={DARK}
						transform="rotate(25 160 196)"
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
					<path
						d="M38 150 C52 154 66 148 76 134"
						stroke={DARK}
						strokeWidth="3.5"
						fill="none"
						strokeLinecap="round"
					/>
					<path
						d="M162 150 C148 154 134 148 124 134"
						stroke={DARK}
						strokeWidth="3.5"
						fill="none"
						strokeLinecap="round"
					/>
					<ellipse
						cx="164"
						cy="194"
						rx="18"
						ry="13"
						fill={DARK}
						transform="rotate(-30 164 194)"
					/>
				</>
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
					<path d="M68 104 Q78 92 92 90 L92 112 A12 12 0 0 1 68 112 Z" />
					<path d="M132 104 Q122 92 108 90 L108 112 A12 12 0 0 0 132 112 Z" />
					<path
						d="M64 92 Q74 80 88 78"
						stroke={DARK}
						strokeWidth="3"
						fill="none"
						strokeLinecap="round"
					/>
					<path
						d="M136 92 Q126 80 112 78"
						stroke={DARK}
						strokeWidth="3"
						fill="none"
						strokeLinecap="round"
					/>
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
					<ellipse cx="80" cy="100" rx="15" ry="19" />
					<ellipse cx="120" cy="100" rx="15" ry="19" />
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

export interface MascotProps {
	expression?: Expression
	size?: number | string
	/** Animación de reposo (flotar + parpadear). */
	idle?: boolean
	className?: string
	title?: string
	/** Hacia dónde mira (-1..1). Mueve los ojos un poquito. */
	look?: { x: number; y: number }
}

/**
 * El personaje guía de la Cripto Cantina, dibujado en SVG para que se anime
 * nítido a cualquier tamaño.
 */
export const Mascot = memo(function Mascot({
	expression = "neutral",
	size = 120,
	idle = true,
	className = "",
	title,
	look,
}: MascotProps) {
	const lx = look ? Math.max(-1, Math.min(1, look.x)) * 7 : 0
	const ly = look ? Math.max(-1, Math.min(1, look.y)) * 5 : 0
	return (
		<span
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
			<svg viewBox="0 0 200 220" width="100%" height="100%">
				<defs>
					<radialGradient id="mascot-shine" cx="0.38" cy="0.28" r="0.75">
						<stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
						<stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" />
					</radialGradient>
				</defs>
				<ellipse
					className="mascot__shadow"
					cx="100"
					cy="214"
					rx="62"
					ry="5"
					fill="#000"
					opacity="0.35"
				/>
				<g className="mascot__body" key={expression}>
					<Arms e={expression} />
					<path d={BODY} fill={BLUE} />
					<path d={BODY} fill="url(#mascot-shine)" />
					<g transform={`translate(${lx.toFixed(1)} ${ly.toFixed(1)})`}>
						<g className="mascot__eyes">
							<Eyes e={expression} />
						</g>
					</g>
					<Front e={expression} />
				</g>
			</svg>
		</span>
	)
})

export default Mascot
