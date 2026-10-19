import {
	KitEventType,
	type Networks,
	StellarWalletsKit,
} from "@creit.tech/stellar-wallets-kit"
import {
	FREIGHTER_ID,
	FreighterModule,
} from "@creit.tech/stellar-wallets-kit/modules/freighter"
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils"
import { isConnected as freighterIsConnected } from "@stellar/freighter-api"
import { Keypair, rpc, xdr } from "@stellar/stellar-sdk"
import { allowHttp, networkPassphrase, rpcUrl, stellarNetwork } from "./env"

// These wallets work on Local and Futurenet while the rest enforce or fail on
// any networks beside Testnet and Mainnet. Filter below based on dApp config.
const CUSTOM_NETWORK_WALLETS = new Set(["freighter", "xbull", "hana"])

// ---------------------------------------------------------------------------
// Detección de Freighter más paciente.
//
// El kit le da a cada wallet solo 1 s para responder `isAvailable()` cuando se
// abre el modal (`refreshSupportedWallets`). Freighter responde pasando por su
// content script y su service worker (MV3); si el worker está dormido o el
// navegador va lento, la respuesta llega después de ese segundo y el kit marca
// Freighter como «Install» aunque esté instalada. Aquí la detectamos antes, con
// reintentos y el timeout completo de freighter-api, y recordamos el resultado
// para que el kit la vea disponible al instante.
// ---------------------------------------------------------------------------

declare global {
	interface Window {
		stellar?: { provider?: string; platform?: string }
	}
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Freighter Mobile (navegador interno) usa WalletConnect, no la extensión. */
const isFreighterMobile = () =>
	typeof window !== "undefined" &&
	window.stellar?.provider === "freighter" &&
	window.stellar?.platform === "mobile"

let freighterSeen = false
let freighterProbe: Promise<boolean> | null = null

const pingFreighter = async (): Promise<boolean> => {
	try {
		// Espera hasta 2 s la respuesta de la extensión.
		const res = await freighterIsConnected()
		return !res.error && res.isConnected
	} catch {
		return false
	}
}

/**
 * Busca la extensión Freighter con reintentos (hasta ~7 s en el peor caso,
 * normalmente responde en milisegundos). Comparte la búsqueda en curso y
 * recuerda el resultado positivo; un resultado negativo se vuelve a intentar
 * en la próxima llamada.
 */
export const detectFreighter = (attempts = 3): Promise<boolean> => {
	if (freighterSeen) return Promise.resolve(true)
	if (typeof window === "undefined" || isFreighterMobile())
		return Promise.resolve(false)
	if (!freighterProbe) {
		freighterProbe = (async () => {
			for (let i = 0; i < attempts; i++) {
				if (await pingFreighter()) {
					freighterSeen = true
					return true
				}
				if (i < attempts - 1) await sleep(400)
			}
			console.warn(
				"[wallet] Freighter no respondió. ¿Está instalada en este navegador/perfil y desbloqueada?",
			)
			return false
		})().finally(() => {
			freighterProbe = null
		})
	}
	return freighterProbe
}

/** `true` si ya sabemos que la extensión Freighter respondió en esta pestaña. */
export const isFreighterDetected = () => freighterSeen

/** Igual que el módulo oficial, pero con la detección paciente de arriba. */
class PatientFreighterModule extends FreighterModule {
	override async isAvailable(): Promise<boolean> {
		if (isFreighterMobile()) return false
		return detectFreighter(2)
	}
}

const withPatientFreighter = (mods: ReturnType<typeof defaultModules>) =>
	mods.map((m) =>
		m.productId === FREIGHTER_ID ? new PatientFreighterModule() : m,
	)

StellarWalletsKit.init({
	network: networkPassphrase as Networks,
	modules: withPatientFreighter(
		stellarNetwork === "LOCAL" || stellarNetwork === "FUTURENET"
			? defaultModules({
					filterBy: (m) => CUSTOM_NETWORK_WALLETS.has(m.productId),
				})
			: defaultModules(),
	),
})

// Calentamos la detección al cargar la página (solo pregunta si la extensión
// existe; no pide acceso ni abre ninguna ventana de Freighter).
if (typeof window !== "undefined") void detectFreighter()

/**
 * Espera (con tope) a saber si Freighter está. Devuelve `true` si respondió.
 * Llamalo antes de `connectWallet` para que el modal la muestre disponible.
 */
export const ensureFreighter = async (maxWaitMs = 7000): Promise<boolean> => {
	if (freighterSeen) return true
	return Promise.race([detectFreighter(), sleep(maxWaitMs).then(() => false)])
}

/** Open the kit's modal right away, without waiting for Freighter detection. */
export const openWalletModal = () => StellarWalletsKit.authModal()

/** Open the built-in wallet-selection modal; resolves once a wallet is connected. */
export const connectWallet = async () => {
	// Si la búsqueda inicial sigue en curso, la esperamos un poco para que el
	// kit no marque Freighter como «Install» por llegar tarde.
	await ensureFreighter(2500)
	return StellarWalletsKit.authModal()
}

/** Open the built-in profile modal (shows the connected account + disconnect). */
export const profileModal = () => StellarWalletsKit.profileModal()

/** Disconnect the active wallet. The kit clears its own persisted state. */
export const disconnectWallet = () => StellarWalletsKit.disconnect()

/** Sign a transaction with the active wallet. Passed to generated contract clients. */
export const signTransaction = StellarWalletsKit.signTransaction

/**
 * Use the wallet's reported network if it supports it, otherwise flag the
 * wallet as unsupported. Note that even if a wallet is `unsupported`, this
 * only means it does not support the `getNetwork` function. It *may* still
 * support passing `networkPassphrase` to `signTransaction`. For the wallets
 * that do not support the `networkPassphrase` argument to `signTransaction`,
 * you can fall back to error parsing to determine if `signTransaction`
 * failures were due to network mismatch.
 */
export const getWalletNetwork = async (): Promise<{
	supported: boolean
	networkPassphrase?: string
}> => {
	try {
		const { networkPassphrase } = await StellarWalletsKit.getNetwork()
		return { supported: true, networkPassphrase }
	} catch {
		return { supported: false }
	}
}

/**
 * Watch the network the wallet itself reports. Extensions emit no event when
 * the user switches networks, so this polls `getNetwork` — the only available
 * signal. The callback fires immediately with the current passphrase
 * (`undefined` when the wallet can't report one) and again on every change.
 *
 * Returns a cleanup function that stops polling. Only used in `onWalletChange`
 */
const onWalletNetworkChange = (
	cb: (networkPassphrase: string | undefined) => void,
	pollInterval = 3000,
): (() => void) => {
	let last: string | undefined
	let first = true
	let timeoutId: ReturnType<typeof setTimeout> | null = null
	let stopped = false

	const poll = async () => {
		const { networkPassphrase } = await getWalletNetwork()
		if (stopped) return
		if (first || networkPassphrase !== last) {
			first = false
			last = networkPassphrase
			cb(networkPassphrase)
		}
		timeoutId = setTimeout(() => void poll(), pollInterval)
	}
	void poll()

	return () => {
		stopped = true
		if (timeoutId != null) clearTimeout(timeoutId)
	}
}

export interface WalletState {
	address: string | undefined
	networkPassphrase: string | undefined
}

/**
 * Subscribe to full wallet state: connected address and network. Fires
 * immediately with the current state on subscribe (covering reload restore)
 * and on every subsequent change: connect, disconnect, or the wallet
 * switching networks (detected via polling, see `onWalletNetworkChange`).
 *
 * Returns an framework-agnostic unsubscribe function.
 */
export const onWalletChange = (
	cb: (state: WalletState) => void,
): (() => void) => {
	let stopPoll: (() => void) | undefined

	const stopState = StellarWalletsKit.on(
		KitEventType.STATE_UPDATED,
		(event) => {
			stopPoll?.()
			stopPoll = undefined
			// NOTE: `event.networkPassphrase` is the app's configured network, not
			// the wallet's connected network. Disregard it and start our own polling
			// logic below if we have an address.
			const { address } = event.payload
			if (address) {
				stopPoll = onWalletNetworkChange((networkPassphrase) =>
					cb({ address, networkPassphrase }),
				)
			} else {
				cb({ address: undefined, networkPassphrase: undefined })
			}
		},
	)

	const stopDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
		stopPoll?.()
		stopPoll = undefined
		cb({ address: undefined, networkPassphrase: undefined })
	})

	return () => {
		stopState()
		stopDisconnect()
		stopPoll?.()
	}
}

// Server is configured from the generated clients' options, which don't change at runtime
const server = new rpc.Server(rpcUrl, { allowHttp })

const formatter = new Intl.NumberFormat()

/** One stroop is 10^-7 XLM. */
const STROOPS_PER_XLM = 10_000_000n

/**
 * Format a stroop amount as XLM. Splits the integer and fractional parts in
 * bigint so large balances don't lose stroops before formatting.
 */
const formatStroops = (stroops: bigint): string => {
	const whole = stroops / STROOPS_PER_XLM
	const fraction = (stroops % STROOPS_PER_XLM).toString().padStart(7, "0")
	return formatter.format(Number(`${whole}.${fraction}`))
}

/**
 * Balances keyed by asset. Only native XLM (`xlm`) is fetched: RPC reads
 * ledger entries by key and can't list an account's trustlines.
 */
export type MappedBalances = { xlm?: { balance: string } }

/**
 * Fetch the account's native XLM balance over RPC. An unfunded account has no
 * ledger entry, so it resolves to `{}` and consumers see no `xlm` key. RPC
 * failures are logged and also resolve to `{}`.
 */
export const fetchBalances = async (
	address: string,
): Promise<MappedBalances> => {
	try {
		const key = xdr.LedgerKey.account(
			new xdr.LedgerKeyAccount({
				accountId: Keypair.fromPublicKey(address).xdrPublicKey(),
			}),
		)
		// `getLedgerEntries` rather than `getAccountEntry`, which reports every
		// failure (including RPC outages) as "Account not found"
		const { entries } = await server.getLedgerEntries(key)
		const account = entries[0]?.val.account()
		if (!account) return {}
		return { xlm: { balance: formatStroops(account.balance().toBigInt()) } }
	} catch (err) {
		console.error(err)
		return {}
	}
}

// The kit itself, for templates that need `on(...)` subscriptions or `setWallet`.
export const wallet = StellarWalletsKit
