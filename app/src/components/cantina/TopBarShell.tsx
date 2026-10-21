import { useLang } from "../../hooks/useLang"
import { type DictKey } from "../../i18n"
import { cavosEnabled, requestCavos } from "../../lib/cavos"
import { LangSwitch } from "./LangSwitch"
import { Mascot } from "./Mascot"

/** Red de la app (la de los clientes generados; el guestbook vive en testnet). */
const APP_NETWORK = "Testnet"

/**
 * Barra superior liviana que se ve durante el intro, idéntica a la real sin
 * wallet conectada. No importa nada de la wallet ni del SDK de Stellar: la
 * barra real (TopBar) la reemplaza cuando termina de cargar el resto de la app.
 * Tocar sus botones pide cargar la app ya.
 */
export function TopBarShell({ onWake }: { onWake: () => void }) {
	const { t } = useLang()
	const netTitle: DictKey = "nav.network.title.disconnected"
	return (
		<header className="topbar">
			<a href="#inicio" className="topbar__brand">
				<Mascot size={26} idle={false} />
				<span>{t("nav.brand")}</span>
			</a>
			<div className="topbar__right">
				<span
					className="pill pill--disconnected"
					title={t(netTitle, { app: APP_NETWORK, wallet: "" })}
				>
					<span className="pill__dot" />
					<span className="pill__text">{APP_NETWORK}</span>
				</span>
				{cavosEnabled() ? (
					<button
						type="button"
						className="btn btn--cavos hide-sm"
						title={t("cavos.title")}
						onClick={() => {
							requestCavos()
							onWake()
						}}
					>
						{t("cavos.short")}
					</button>
				) : (
					<span className="cavos-wrap hide-sm" title={t("cavos.disabled")}>
						<button type="button" className="btn btn--cavos" disabled>
							{t("cavos.short")}
						</button>
					</span>
				)}
				<button type="button" className="btn btn--primary" onClick={onWake}>
					{t("nav.connect")}
				</button>
				<LangSwitch />
				<button
					type="button"
					className="help-btn"
					onClick={onWake}
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
