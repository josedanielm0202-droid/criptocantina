import {
	networkPassphrase as appPassphrase,
	fundAccount,
} from "@stellar-scaffold/app-lib"
import {
	createContext,
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react"
import {
	type CavosActions,
	type CavosSnapshot,
	type CavosStatus,
} from "../components/cantina/CavosBridge"
import { useLang } from "../hooks/useLang"
import {
	cavosEnabled,
	hadCavos,
	isCavosCallback,
	onCavosRequest,
	preloadCavos,
	rememberCavos,
	takeCavosRequest,
} from "../lib/cavos"
import {
	fetchBalances,
	hadWallet,
	loadWallet,
	type MappedBalances,
	signTransaction,
	whenWalletLoaded,
} from "../lib/wallet"

/**
 * A good-enough implementation of deepEqual.
 *
 * Used in this file to compare MappedBalances.
 *
 * Should maybe add & use a new dependency instead, if needed elsewhere.
 */
function deepEqual<T>(a: T, b: T): boolean {
	if (a === b) {
		return true
	}

	const bothAreObjects =
		a && b && typeof a === "object" && typeof b === "object"

	return Boolean(
		bothAreObjects &&
		Object.keys(a).length === Object.keys(b).length &&
		Object.entries(a).every(([k, v]) => deepEqual(v, b[k as keyof T])),
	)
}

/** Estado de Cavos (la segunda forma de entrar) para la UI. */
export interface CavosContext {
	/** hay App ID configurado */
	enabled: boolean
	/** cargando el kit / reconectando / abriendo el modal */
	busy: boolean
	status?: CavosStatus
	email?: string
	error?: string | null
	open: () => void
	logout: () => void
	firmar: (contractId: string, mensaje: string) => Promise<string>
}

export interface WalletContextType {
	/** dirección activa, venga de Freighter (kit) o de Cavos */
	address?: string
	/** de dónde sale `address` */
	source?: "freighter" | "cavos"
	cavos: CavosContext
	balances: MappedBalances
	isPending: boolean
	networkPassphrase?: string
	signTransaction: typeof signTransaction
	updateBalances: () => Promise<void>
}

const noCavos: CavosContext = {
	enabled: false,
	busy: false,
	open: () => {},
	logout: () => {},
	firmar: () => Promise.reject(new Error("err.noWallet")),
}

export const WalletContext = // @ts-ignore
	createContext<WalletContextType>({
		isPending: true,
		balances: {},
		updateBalances: async () => {},
		signTransaction,
		cavos: noCavos,
	})

// El kit de Cavos va en su propio archivo: solo se descarga al usarlo.
const CavosBridge = lazy(preloadCavos)

/** Espera a que Horizon (testnet) vea la cuenta recién creada. */
async function waitForAccount(addr: string, ms = 15000) {
	const end = Date.now() + ms
	while (Date.now() < end) {
		try {
			const r = await fetch(
				`https://horizon-testnet.stellar.org/accounts/${addr}`,
			)
			if (r.ok) return
		} catch {
			/* reintento */
		}
		await new Promise((r) => setTimeout(r, 1200))
	}
}

/** Cavos: monta el puente cuando hace falta y expone estado + acciones. */
function useCavosState() {
	const { lang } = useLang()
	const enabled = cavosEnabled()
	const [on, setOn] = useState(
		() => enabled && (hadCavos() || isCavosCallback()),
	)
	const [snap, setSnapState] = useState<CavosSnapshot>({ loaded: false })
	const [bridgeKey, setBridgeKey] = useState(0)
	const snapRef = useRef(snap)
	const waiters = useRef(new Set<(s: CavosSnapshot) => void>())
	const reconnecting = useRef(false)
	const setSnap = useCallback((next: CavosSnapshot) => {
		// mientras reconectamos, mantenemos la dirección en pantalla (sin parpadeo)
		const s =
			reconnecting.current && !next.loaded
				? { ...snapRef.current, loaded: false }
				: next
		snapRef.current = s
		setSnapState(s)
		waiters.current.forEach((w) => w(s))
	}, [])
	/** Vuelve a montar Cavos (reconexión silenciosa) y espera el nuevo estado. */
	const reconnect = useCallback(
		() =>
			new Promise<CavosSnapshot>((resolve) => {
				const done = (s: CavosSnapshot) => {
					if (!s.loaded || !s.status) return
					waiters.current.delete(done)
					clearTimeout(timer)
					reconnecting.current = false
					resolve(s)
				}
				const timer = setTimeout(() => {
					waiters.current.delete(done)
					reconnecting.current = false
					resolve(snapRef.current)
				}, 20000)
				waiters.current.add(done)
				reconnecting.current = true
				actions.current = null
				snapRef.current = { ...snapRef.current, loaded: false }
				setBridgeKey((k) => k + 1)
			}),
		[],
	)
	const [opening, setOpening] = useState(false)
	const actions = useRef<CavosActions | null>(null)
	const wantOpen = useRef(false)

	const open = useCallback(() => {
		if (!enabled) return
		if (actions.current) {
			actions.current.open()
			return
		}
		wantOpen.current = true
		setOpening(true)
		setOn(true)
	}, [enabled])

	const onMounted = useCallback(() => {
		setOpening(false)
		if (wantOpen.current) {
			wantOpen.current = false
			actions.current?.open()
		}
	}, [])

	// pedido que llegó desde la barra liviana del intro
	useEffect(() => {
		const check = () => takeCavosRequest() && open()
		check()
		return onCavosRequest(check)
	}, [open])

	useEffect(() => {
		if (snap.address) rememberCavos(true)
		else if (snap.loaded && !isCavosCallback()) rememberCavos(false)
	}, [snap.address, snap.loaded])

	const logout = useCallback(() => {
		actions.current?.logout()
		rememberCavos(false)
		setSnap({ loaded: true })
	}, [setSnap])

	const firmar = useCallback(
		async (contractId: string, mensaje: string) => {
			const s0 = snapRef.current
			if (!actions.current || !s0.address) throw new Error("err.noWallet")
			if (s0.status === "needs-device-approval")
				await actions.current.authorize()
			if (snapRef.current.status === "undeployed") {
				// Conectar no crea la cuenta en la red. La creamos con Friendbot
				// (testnet) y reconectamos: con la cuenta ya creada el kit la ve
				// «ready» y puede llamar al contrato.
				const addr = s0.address
				await fundAccount(addr) // si ya existía, Friendbot solo se queja
				await waitForAccount(addr)
				const s1 = await reconnect()
				if (s1.status !== "ready") throw new Error(`cavos: ${s1.status ?? "?"}`)
			}
			const act = actions.current as CavosActions | null
			if (!act) throw new Error("err.noWallet")
			try {
				return await act.invoke(contractId, mensaje, true)
			} catch (e) {
				// Si el relayer no patrocina (plan/límites), la cuenta paga su
				// propia comisión con el XLM de prueba de Friendbot.
				if (!/relay|sponsor|fee.?bump/i.test(String(e))) throw e
				console.warn("[cavos] sin patrocinio, pago la comisión:", e)
				return await act.invoke(contractId, mensaje, false)
			}
		},
		[reconnect],
	)

	const ctx: CavosContext = useMemo(
		() =>
			enabled
				? {
						enabled,
						busy: opening || (on && !snap.loaded && !snap.address),
						status: snap.status,
						email: snap.email,
						error: snap.error,
						open,
						logout,
						firmar,
					}
				: noCavos,
		[enabled, opening, on, snap, open, logout, firmar],
	)

	const bridge = on ? (
		<Suspense fallback={null}>
			<CavosBridge
				key={bridgeKey}
				lang={lang}
				onState={setSnap}
				actionsRef={actions}
				onMounted={onMounted}
			/>
		</Suspense>
	) : null

	return { ctx, address: snap.address, bridge }
}

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
	const [balances, setBalances] = useState<MappedBalances>({})
	const [address, setAddress] = useState<string>()
	const [networkPassphrase, setNetworkPassphrase] = useState<string>()
	const [isPending, setIsPending] = useState(true)
	const cavos = useCavosState()
	// Si hay sesión de Cavos, manda Cavos (no hay balances de Freighter que mostrar:
	// las firmas con Cavos son patrocinadas y no necesitan XLM).
	const activeAddress = cavos.address ?? address
	const source: WalletContextType["source"] = cavos.address
		? "cavos"
		: address
			? "freighter"
			: undefined

	const updateBalances = useCallback(async () => {
		if (!address || cavos.address) {
			setBalances({})
			return
		}

		const newBalances = await fetchBalances(address)
		setBalances((prev) => {
			if (deepEqual(newBalances, prev)) return prev
			return newBalances
		})
	}, [address, cavos.address])

	// Refetch on address change (via `updateBalances`' identity) and on network
	// change — the same address holds different balances per network.
	useEffect(() => {
		void updateBalances()
	}, [updateBalances, networkPassphrase])

	// Subscribe to wallet state. Gets values immediately and on every subsequent
	// change: connect, disconnect, and the wallet switching networks.
	// La wallet se carga recién cuando hace falta (ver lib/wallet.ts): si había
	// una conectada de antes, en un momento libre; si no, al tocar "Conectar".
	useEffect(() => {
		let stop: (() => void) | undefined
		let alive = true
		const cancel = whenWalletLoaded((m) => {
			if (!alive) return
			stop = m.onWalletChange((state) => {
				setAddress(state.address)
				setNetworkPassphrase(state.networkPassphrase)
				setIsPending(false)
				if (!state.address) setBalances({})
			})
		})
		let idle = 0
		if (hadWallet()) {
			const ric =
				window.requestIdleCallback ??
				((cb: () => void) => window.setTimeout(cb, 1200))
			idle = ric(() => void loadWallet(), {
				timeout: 4000,
			} as IdleRequestOptions)
		} else setIsPending(false)
		return () => {
			alive = false
			cancel()
			stop?.()
			window.cancelIdleCallback?.(idle)
		}
	}, [])

	const contextValue = useMemo(
		() => ({
			address: activeAddress,
			source,
			// Cavos siempre firma en la red de la app (testnet)
			networkPassphrase: cavos.address ? appPassphrase : networkPassphrase,
			balances,
			updateBalances,
			isPending,
			signTransaction,
			cavos: cavos.ctx,
		}),
		[
			activeAddress,
			source,
			cavos.address,
			cavos.ctx,
			networkPassphrase,
			balances,
			updateBalances,
			isPending,
		],
	)

	return (
		<WalletContext value={contextValue}>
			{children}
			{cavos.bridge}
		</WalletContext>
	)
}
