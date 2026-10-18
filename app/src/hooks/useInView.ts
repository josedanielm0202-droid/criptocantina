import { type RefObject, useEffect, useState } from "react"

/** `true` cuando el elemento entra a la pantalla (una sola vez por defecto). */
export function useInView<T extends Element>(
	ref: RefObject<T | null>,
	{ threshold = 0.35, once = true, rootMargin = "0px" } = {},
) {
	const [inView, setInView] = useState(false)
	useEffect(() => {
		const el = ref.current
		if (!el) return
		const io = new IntersectionObserver(
			([entry]) => {
				if (!entry) return
				if (entry.isIntersecting) {
					setInView(true)
					if (once) io.disconnect()
				} else if (!once) setInView(false)
			},
			{ threshold, rootMargin },
		)
		io.observe(el)
		return () => io.disconnect()
	}, [ref, threshold, once, rootMargin])
	return inView
}
