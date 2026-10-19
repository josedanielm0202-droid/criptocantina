import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react"
import { useLang } from "../../hooks/useLang"
import { type DictKey } from "../../i18n"
import { type Expression, Mascot } from "./Mascot"

interface Bubble {
	id: number
	key: DictKey
	expression: Expression
}

interface GuideContextType {
	/** Muestra una burbuja rápida del personaje. */
	say: (key: DictKey, expression?: Expression, ms?: number) => void
	/** Igual que `say`, pero solo la primera vez para ese id. */
	sayOnce: (
		id: string,
		key: DictKey,
		expression?: Expression,
		ms?: number,
	) => void
	/** Cambia la expresión sin decir nada. */
	mood: (expression: Expression, ms?: number) => void
	dismiss: () => void
}

const GuideContext = createContext<GuideContextType | undefined>(undefined)

export const useGuide = () => {
	const ctx = use(GuideContext)
	if (!ctx) throw new Error("useGuide must be used within GuideProvider")
	return ctx
}

const FUN: { key: DictKey; e: Expression }[] = [
	{ key: "guide.scroll", e: "divertido" },
	{ key: "guide.intro", e: "sorprendido" },
	{ key: "guide.hello", e: "emocionado" },
]

export const GuideProvider = ({ children }: { children: React.ReactNode }) => {
	const { t } = useLang()
	const [bubble, setBubble] = useState<Bubble | null>(null)
	const [expression, setExpression] = useState<Expression>("neutral")
	const bubbleTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
	const moodTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
	const said = useRef(new Set<string>())
	const seq = useRef(0)
	const funIdx = useRef(0)

	const mood = useCallback((e: Expression, ms = 4200) => {
		setExpression(e)
		clearTimeout(moodTimer.current)
		if (ms > 0)
			moodTimer.current = setTimeout(() => setExpression("neutral"), ms)
	}, [])

	const dismiss = useCallback(() => {
		clearTimeout(bubbleTimer.current)
		setBubble(null)
	}, [])

	const say = useCallback(
		(key: DictKey, e: Expression = "neutral", ms = 3600) => {
			seq.current += 1
			setBubble({ id: seq.current, key, expression: e })
			mood(e, ms + 600)
			clearTimeout(bubbleTimer.current)
			bubbleTimer.current = setTimeout(() => setBubble(null), ms)
		},
		[mood],
	)

	const sayOnce = useCallback(
		(id: string, key: DictKey, e?: Expression, ms?: number) => {
			if (said.current.has(id)) return
			said.current.add(id)
			say(key, e, ms)
		},
		[say],
	)

	useEffect(
		() => () => {
			clearTimeout(bubbleTimer.current)
			clearTimeout(moodTimer.current)
		},
		[],
	)

	// Valor estable: cambiar la expresión solo re-renderiza la guía flotante,
	// no toda la página (antes cada burbuja re-renderizaba todo mientras scrolleás).
	const value = useMemo(
		() => ({ say, sayOnce, mood, dismiss }),
		[say, sayOnce, mood, dismiss],
	)

	const poke = () => {
		if (bubble) return dismiss()
		const f = FUN[funIdx.current % FUN.length]
		funIdx.current += 1
		if (f) say(f.key, f.e, 2600)
	}

	return (
		<GuideContext value={value}>
			{children}
			<div className="guide" data-has-bubble={bubble ? "" : undefined}>
				<button
					type="button"
					className="guide__mascot"
					onClick={poke}
					aria-label={t("guide.mascot")}
				>
					<Mascot expression={expression} size={84} />
				</button>
				{bubble && (
					<button
						type="button"
						key={bubble.id}
						className="guide__bubble"
						onClick={dismiss}
						aria-live="polite"
						title={t("guide.tap")}
					>
						{t(bubble.key)}
						<span className="guide__timer" />
					</button>
				)}
			</div>
		</GuideContext>
	)
}
