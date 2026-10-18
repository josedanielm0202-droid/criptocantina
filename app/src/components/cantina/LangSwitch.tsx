import { useLang } from "../../hooks/useLang"

/** Palanca ES / EN. */
export function LangSwitch() {
	const { lang, toggleLang, t } = useLang()
	return (
		<button
			type="button"
			role="switch"
			aria-checked={lang === "en"}
			aria-label={t("nav.lang")}
			title={t("nav.lang")}
			className={`lever lever--${lang}`}
			onClick={toggleLang}
		>
			<span className="lever__label lever__label--es">ES</span>
			<span className="lever__track">
				<span className="lever__knob" />
			</span>
			<span className="lever__label lever__label--en">EN</span>
		</button>
	)
}
