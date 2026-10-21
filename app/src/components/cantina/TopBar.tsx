import {
	fundAccount,
	networkStatus,
	shortAddress,
	stellarNetwork,
} from "@stellar-scaffold/app-lib"
import { useRef, useState, useTransition } from "react"
import { useLang } from "../../hooks/useLang"
import { useWallet } from "../../hooks/useWallet"
import { type DictKey } from "../../i18n"
import {
	ensureFreighter,
	isFreighterDetected,
	loadWallet,
	openWalletModal,
	profileModal,
} from "../../lib/wallet"
import { useGuide } from "./Guide"
import { LangSwitch } from "./LangSwitch"
import { Mascot } from "./Mascot"

export function useAccountState() {
	const { address, networkPassphrase, balances, isPending } = useWallet()
	const net = networkStatus(address, networkPassphrase)
	const funded = balances.xlm !== undefined
	return { address, net, funded, isPending, balances }
}

export function FundButton({ className = "" }: { className?: string }) {
	const { t } = useLang()
	const { say } = useGuide()
	const { address, updateBalances } = useWallet()
	const [pending, start] = useTransition()
	if (!address || stellarNetwork === "PUBLIC") return null
	return (
		<button
			type="button"
			className={`btn btn--ghost ${className}`}
			disabled={pending}
			onClick={() =>
				start(async () => {
					const { ok } = await fundAccount(address)
					if (ok) await updateBalances()
					say(ok ? "fund.ok" : "fund.fail", ok ? "emocionado" : "triste")
				})
			}
		>
			{pending ? t("nav.funding") : t("nav.fund")}
		</button>
	)
}

/** Ya avisamos que Freighter no responde (compartido entre botones). */
let warnedNoFreighter = false

export function ConnectButton({ className = "" }: { className?: string }) {
	const { t } = useLang()
	const { say } = useGuide()
	const { isPending } = useWallet()
	const [checking, setChecking] = useState(false)
	const busy = useRef(false)

	const onConnect = async () => {
		if (busy.current) return
		busy.current = true
		setChecking(true)
		try {
			// Normalmente ya se detectó al cargar la página y esto es instantáneo.
			let ok = isFreighterDetected()
			if (!ok && !warnedNoFreighter) ok = await ensureFreighter(4500)
			if (!ok && !warnedNoFreighter) {
				// Primera vez: explicamos qué pasa en vez de abrir el modal con
				// «Install». Si vuelve a tocar, abrimos el modal igual (por si quiere
				// usar otra wallet).
				warnedNoFreighter = true
				say("wallet.noFreighter", "triste", 12000)
				return
			}
			setChecking(false)
			await openWalletModal()
		} catch {
			// El usuario cerró el modal o canceló en la wallet.
		} finally {
			busy.current = false
			setChecking(false)
		}
	}

	return (
		<button
			type="button"
			className={`btn btn--primary ${className}`}
			onClick={() => void onConnect()}
			// precarga la wallet (y la detección de Freighter) al acercar el mouse
			onPointerEnter={() => void loadWallet()}
			onFocus={() => void loadWallet()}
			disabled={isPending || checking}
		>
			{isPending || checking ? t("nav.loading") : t("nav.connect")}
		</button>
	)
}

export function TopBar({ onHelp }: { onHelp: () => void }) {
	const { t } = useLang()
	const { address, net, funded, balances } = useAccountState()

	const netLabel: DictKey = `nav.network.${net.state === "ok" ? "ok" : net.state}`
	const netTitle: DictKey = `nav.network.title.${net.state}`

	return (
		<header className="topbar">
			<a href="#inicio" className="topbar__brand">
				<Mascot size={26} idle={false} />
				<span>{t("nav.brand")}</span>
			</a>
			<div className="topbar__right">
				<span
					className={`pill pill--${net.state}`}
					title={t(netTitle, {
						app: net.appNetwork,
						wallet: net.walletNetwork,
					})}
				>
					<span className="pill__dot" />
					<span className="pill__text">
						{net.state === "ok" || net.state === "disconnected"
							? net.appNetwork
							: t(netLabel)}
					</span>
				</span>
				{address && !funded && net.state !== "mismatch" && (
					<FundButton className="hide-sm" />
				)}
				{address ? (
					<button
						type="button"
						className="btn btn--wallet"
						onClick={() => void profileModal()}
						title={t("nav.profile")}
					>
						{balances.xlm && (
							<span className="btn__bal hide-sm">
								{balances.xlm.balance} XLM
							</span>
						)}
						<span className="mono">{shortAddress(address)}</span>
					</button>
				) : (
					<ConnectButton />
				)}
				<LangSwitch />
				<button
					type="button"
					className="help-btn"
					onClick={onHelp}
					aria-label={t("nav.help")}
					title={t("nav.help")}
				>
					?
				</button>
			</div>
			<div className="rail" aria-hidden>
				<span className="rail__line" />
				<span className="rail__rider">
					<Mascot size={18} idle={false} />
				</span>
			</div>
		</header>
	)
}
