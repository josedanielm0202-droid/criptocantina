import { lazy, Suspense, useCallback, useEffect, useState } from "react"
import { Dive } from "./components/cantina/Dive"
import { INTRO_PLAY } from "./components/cantina/Hero"
import { ScrollFX } from "./components/cantina/ScrollFX"
import { TopBarShell } from "./components/cantina/TopBarShell"
import { prefersReducedMotion } from "./lib/smooth"

/**
 * Todo lo pesado (wallet kit, SDK de Stellar, cliente del contrato, react-query,
 * router, libro, moneda 3D…) va en otro archivo que se descarga y ejecuta
 * DESPUÉS del intro. Así el intro arranca enseguida y nada le quita frames.
 */
const App = lazy(() => import("./App"))

const isDebugPath = () => /\/debug(\/|$)/.test(location.pathname)

/** Cuándo cargar el resto: al terminar el intro automático o al primer gesto. */
function useWakeApp() {
	const [wake, setWake] = useState(
		() => prefersReducedMotion() || !!location.hash || isDebugPath(),
	)
	const now = useCallback(() => setWake(true), [])
	useEffect(() => {
		if (wake) return
		let afterIntro: ReturnType<typeof setTimeout> | undefined
		const onPlay = () => {
			clearTimeout(afterIntro)
			afterIntro = setTimeout(now, 3100)
		}
		window.addEventListener(INTRO_PLAY, onPlay)
		const safety = setTimeout(now, 6000)
		const opts = { passive: true, once: true } as const
		const evs = ["wheel", "touchstart", "keydown", "scroll", "pointerdown"]
		evs.forEach((ev) => window.addEventListener(ev, now, opts))
		return () => {
			window.removeEventListener(INTRO_PLAY, onPlay)
			clearTimeout(afterIntro)
			clearTimeout(safety)
			evs.forEach((ev) => window.removeEventListener(ev, now))
		}
	}, [wake, now])
	return [wake, now] as const
}

export function AppShell() {
	const [wake, wakeNow] = useWakeApp()
	const [ready, setReady] = useState(false)
	const onReady = useCallback(() => setReady(true), [])
	const debug = isDebugPath()
	return (
		<>
			<ScrollFX />
			{!ready && <TopBarShell onWake={wakeNow} />}
			<main className="page">
				{!debug && <Dive />}
				{wake && (
					<Suspense fallback={null}>
						<App onReady={onReady} />
					</Suspense>
				)}
			</main>
		</>
	)
}
