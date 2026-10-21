/**
 * Acceso diferido a la wallet. El kit de wallets (con sus módulos, rxjs,
 * preact, albedo…) pesa ~500 KB y solo hace falta cuando la persona toca
 * "Conectar wallet", firma, o ya tenía una wallet conectada de antes. Así no
 * se descarga ni se ejecuta en la carga de la página.
 */
import type * as W from "@stellar-scaffold/app-lib/wallet"
type WalletMod = typeof W

let mod: Promise<WalletMod> | null = null
let loaded: WalletMod | null = null
const waiting = new Set<(m: WalletMod) => void>()

export const loadWallet = (): Promise<WalletMod> =>
	(mod ??= import("@stellar-scaffold/app-lib/wallet").then((m) => {
		loaded = m
		waiting.forEach((cb) => cb(m))
		waiting.clear()
		return m
	}))

/** Llama a `cb` cuando la wallet esté cargada (ya o más adelante). */
export const whenWalletLoaded = (cb: (m: WalletMod) => void): (() => void) => {
	if (loaded) {
		cb(loaded)
		return () => {}
	}
	waiting.add(cb)
	return () => waiting.delete(cb)
}

/** ¿Quedó una wallet conectada de una visita anterior? (clave del kit) */
export const hadWallet = (): boolean => {
	try {
		return !!localStorage.getItem("@StellarWalletsKit/activeAddress")
	} catch {
		return false
	}
}

export const isFreighterDetected = () => loaded?.isFreighterDetected() ?? false
export const ensureFreighter = async (ms?: number) =>
	(await loadWallet()).ensureFreighter(ms)
export const openWalletModal = async () =>
	(await loadWallet()).openWalletModal()
export const profileModal = async () => (await loadWallet()).profileModal()
export const fetchBalances = async (address: string) =>
	(await loadWallet()).fetchBalances(address)
export const signTransaction: WalletMod["signTransaction"] = async (...args) =>
	(await loadWallet()).signTransaction(...args)

export type {
	MappedBalances,
	WalletState,
} from "@stellar-scaffold/app-lib/wallet"
