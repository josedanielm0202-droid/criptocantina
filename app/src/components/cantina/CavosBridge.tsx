/**
 * Puente con Cavos. Este módulo SÍ importa el kit, así que se carga con
 * import() (ver WalletProvider) solo cuando hace falta.
 *
 * Monta el CavosProvider (que trae el modal de login: Google, Apple o código
 * por correo) y le pasa al WalletProvider un resumen del estado más las
 * acciones (abrir, salir, firmar).
 */
import { CavosProvider, useCavos } from "@cavos/kit/react"
import { Address, nativeToScVal } from "@stellar/stellar-sdk"
import { useEffect, useRef } from "react"
import { CAVOS_APP_ID, CAVOS_APP_SALT } from "../../lib/cavos"

export type CavosStatus = "undeployed" | "ready" | "needs-device-approval"

export interface CavosSnapshot {
	/** el proveedor ya terminó de reconectar / procesar el login */
	loaded: boolean
	address?: string
	status?: CavosStatus
	email?: string
	error?: string | null
}

export interface CavosActions {
	open: () => void
	logout: () => void
	authorize: () => Promise<void>
	/** firmar(autor = esta cuenta, mensaje). Devuelve el hash. */
	invoke: (
		contractId: string,
		mensaje: string,
		sponsored: boolean,
	) => Promise<string>
}

type Props = {
	lang: "es" | "en"
	onState: (s: CavosSnapshot) => void
	actionsRef: React.RefObject<CavosActions | null>
	onMounted: () => void
}

function Sync({ onState, actionsRef, onMounted }: Omit<Props, "lang">) {
	const c = useCavos()
	const w = c.wallet?.chain === "stellar" ? c.wallet : null
	const latest = useRef(c)
	latest.current = c

	useEffect(() => {
		onState({
			loaded: !c.isLoading,
			address: w?.address ?? undefined,
			status: w?.status,
			email: c.user?.email,
			error: c.authError,
		})
		// walletStatus cambia cuando la cuenta se crea on-chain (lazy deploy)
	}, [c.isLoading, w, w?.address, c.walletStatus, c.user, c.authError, onState])

	useEffect(() => {
		actionsRef.current = {
			open: () => {
				latest.current.clearAuthError()
				latest.current.openModal()
			},
			logout: () => latest.current.logout(),
			authorize: () => latest.current.authorizeDevice(),
			invoke: async (contractId, mensaje, sponsored) => {
				const wallet = latest.current.wallet
				if (wallet?.chain !== "stellar") throw new Error("err.noWallet")
				// invokeContract simula firmar(autor, mensaje), firma solo la
				// autorización de esta cuenta (require_auth(autor)) y la manda:
				// patrocinada por el relayer de Cavos, o pagando la cuenta su comisión.
				return wallet.invokeContract({
					contractId,
					method: "firmar",
					args: [
						new Address(wallet.address).toScVal(),
						nativeToScVal(mensaje, { type: "string" }),
					],
					opts: sponsored ? undefined : { sponsored: false },
				})
			},
		}
		onMounted()
		return () => {
			actionsRef.current = null
		}
	}, [actionsRef, onMounted])

	return null
}

export default function CavosBridge({ lang, ...rest }: Props) {
	if (!CAVOS_APP_ID) return null
	return (
		<CavosProvider
			config={{
				appId: CAVOS_APP_ID,
				appSalt: CAVOS_APP_SALT,
				chains: ["stellar"],
				defaultChain: "stellar",
				network: "testnet",
			}}
			modal={{
				appName: lang === "es" ? "Cripto Cantina" : "Crypto Cantina",
				providers: ["google", "apple", "email"],
				theme: "dark",
				primaryColor: "#d6b062",
			}}
		>
			<Sync {...rest} />
		</CavosProvider>
	)
}
