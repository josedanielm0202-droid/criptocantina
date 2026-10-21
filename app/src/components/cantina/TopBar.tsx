import {
	fundAccount,
	networkStatus,
	shortAddress,
	stellarNetwork,
} from "@stellar-scaffold/app-lib"
import { useEffect, useRef, useState, useTransition } from "react"
import { useLang } from "../../hooks/useLang"
import { useWallet } from "../../hooks/useWallet"
import { type DictKey } from "../../i18n"
import { preloadCavos } from "../../lib/cavos"
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
	const { address, networkPassphrase, balances, isPending, source } =
		useWallet()
	const net = networkStatus(address, networkPassphrase)
	// Con Cavos las firmas son patrocinadas: no hace falta cargar XLM.
	const funded = source === "cavos" || balances.xlm !== undefined
	return { address, net, funded, isPending, balances, source }
}

export function FundButton({ className = "" }: { className?: string }) {
	const { t } = useLang()
	const { say } = useGuide()
	const { address, updateBalances, source } = useWallet()
	const [pending, start] = useTransition()
	if (!address || source === "cavos" || stellarNetwork === "PUBLIC") return null
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

/**
 * «Entrar con Cavos (Google/correo)»: segunda forma de entrar, sin extensión.
 * Sin App ID configurado se ve deshabilitado con una explicación.
 */
export function CavosButton({
	className = "",
	short = false,
}: {
	className?: string
	short?: boolean
}) {
	const { t } = useLang()
	const { cavos, isPending } = useWallet()
	const label = short ? t("cavos.short") : t("cavos.signin")
	if (!cavos.enabled)
		return (
			<span className="cavos-wrap" title={t("cavos.disabled")} tabIndex={0}>
				<button
					type="button"
					className={`btn btn--cavos ${className}`}
					disabled
					aria-disabled
				>
					{label}
				</button>
			</span>
		)
	return (
		<button
			type="button"
			className={`btn btn--cavos ${className}`}
			onClick={cavos.open}
			onPointerEnter={() => void preloadCavos()}
			onFocus={() => void preloadCavos()}
			disabled={cavos.busy || isPending}
			title={t("cavos.title")}
		>
			{cavos.busy ? t("nav.loading") : label}
		</button>
	)
}

/** Botón de la cuenta Cavos: dirección + menú (copiar / salir). */
function CavosAccount({ address }: { address: string }) {
	const { t } = useLang()
	const { cavos } = useWallet()
	const [open, setOpen] = useState(false)
	const [copied, setCopied] = useState(false)
	const ref = useRef<HTMLDivElement>(null)
	useEffect(() => {
		if (!open) return
		const off = (e: PointerEvent) =>
			!ref.current?.contains(e.target as Node) && setOpen(false)
		const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
		window.addEventListener("pointerdown", off)
		window.addEventListener("keydown", esc)
		return () => {
			window.removeEventListener("pointerdown", off)
			window.removeEventListener("keydown", esc)
		}
	}, [open])
	return (
		<div className="cavos-acct" ref={ref}>
			<button
				type="button"
				className="btn btn--wallet"
				onClick={() => setOpen((o) => !o)}
				title={t("cavos.account")}
				aria-expanded={open}
			>
				<span className="btn__bal hide-sm">Cavos</span>
				<span className="mono">{shortAddress(address)}</span>
			</button>
			{open && (
				<div className="cavos-menu" role="menu">
					{cavos.email && <p className="cavos-menu__who mono">{cavos.email}</p>}
					<button
						type="button"
						role="menuitem"
						onClick={() => {
							void navigator.clipboard?.writeText(address)
							setCopied(true)
							setTimeout(() => setCopied(false), 1500)
						}}
					>
						{copied ? t("cavos.copied") : t("cavos.copy")}
					</button>
					<button
						type="button"
						role="menuitem"
						onClick={() => {
							setOpen(false)
							cavos.logout()
						}}
					>
						{t("cavos.logout")}
					</button>
				</div>
			)}
		</div>
	)
}

export function TopBar({ onHelp }: { onHelp: () => void }) {
	const { t } = useLang()
	const { address, net, funded, balances, source } = useAccountState()

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
				{address && source === "cavos" ? (
					<CavosAccount address={address} />
				) : address ? (
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
					<>
						<CavosButton className="hide-sm" short />
						<ConnectButton />
					</>
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
