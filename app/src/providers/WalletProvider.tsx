import { createContext, useCallback, useEffect, useMemo, useState } from "react"
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

export interface WalletContextType {
	address?: string
	balances: MappedBalances
	isPending: boolean
	networkPassphrase?: string
	signTransaction: typeof signTransaction
	updateBalances: () => Promise<void>
}

export const WalletContext = // @ts-ignore
	createContext<WalletContextType>({
		isPending: true,
		balances: {},
		updateBalances: async () => {},
		signTransaction,
	})

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
	const [balances, setBalances] = useState<MappedBalances>({})
	const [address, setAddress] = useState<string>()
	const [networkPassphrase, setNetworkPassphrase] = useState<string>()
	const [isPending, setIsPending] = useState(true)

	const updateBalances = useCallback(async () => {
		if (!address) {
			setBalances({})
			return
		}

		const newBalances = await fetchBalances(address)
		setBalances((prev) => {
			if (deepEqual(newBalances, prev)) return prev
			return newBalances
		})
	}, [address])

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
			address,
			networkPassphrase,
			balances,
			updateBalances,
			isPending,
			signTransaction,
		}),
		[address, networkPassphrase, balances, updateBalances, isPending],
	)

	return <WalletContext value={contextValue}>{children}</WalletContext>
}
