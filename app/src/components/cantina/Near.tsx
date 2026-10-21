import {
	type ReactNode,
	startTransition,
	Suspense,
	useEffect,
	useRef,
	useState,
} from "react"

/**
 * Monta `children` recién cuando la sección se acerca a la pantalla
 * (a ~1.5 pantallas de distancia). Hasta entonces deja un hueco del mismo
 * alto aproximado para que el scroll no salte. Sirve para que piezas pesadas
 * (el libro, la moneda 3D) no se descarguen ni se dibujen en la carga; si
 * nadie se acerca, se montan solas en un momento libre (idleMs).
 */
export function Near({
	children,
	minHeight,
	className,
	idleMs = 5000,
}: {
	children: ReactNode
	minHeight: number
	className?: string
	/** además, montarlo en un momento libre pasados estos ms (0 = nunca) */
	idleMs?: number
}) {
	const ref = useRef<HTMLDivElement>(null)
	const [on, setOn] = useState(
		() => typeof IntersectionObserver === "undefined",
	)
	useEffect(() => {
		const el = ref.current
		if (on || !el) return
		const io = new IntersectionObserver(
			(es) => {
				if (es.some((e) => e.isIntersecting)) {
					setOn(true)
					io.disconnect()
				}
			},
			{ rootMargin: "150% 0px" },
		)
		io.observe(el)
		// Si la persona no se acerca, se monta igual en un momento libre, así
		// el trabajo de React/estilos no cae justo cuando llega haciendo scroll.
		let idle = 0
		const t = idleMs
			? window.setTimeout(() => {
					const ric =
						window.requestIdleCallback ??
						((cb: () => void) => window.setTimeout(cb, 50))
					idle = ric(() => startTransition(() => setOn(true)), {
						timeout: 3000,
					} as IdleRequestOptions)
				}, idleMs)
			: 0
		return () => {
			io.disconnect()
			window.clearTimeout(t)
			window.cancelIdleCallback?.(idle)
		}
	}, [on, idleMs])
	const hole = <div style={{ minHeight }} aria-hidden />
	return (
		<div ref={ref} className={className}>
			{on ? <Suspense fallback={hole}>{children}</Suspense> : hole}
		</div>
	)
}
