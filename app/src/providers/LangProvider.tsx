import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import {
	type DictKey,
	initialLang,
	type Lang,
	LANG_STORAGE_KEY,
	translate,
	type Vars,
} from "../i18n"

export interface LangContextType {
	lang: Lang
	setLang: (lang: Lang) => void
	toggleLang: () => void
	t: (key: DictKey, vars?: Vars) => string
}

export const LangContext = createContext<LangContextType | undefined>(undefined)

export const LangProvider = ({ children }: { children: React.ReactNode }) => {
	const [lang, setLangState] = useState<Lang>(initialLang)

	const setLang = useCallback((next: Lang) => {
		setLangState(next)
		try {
			localStorage.setItem(LANG_STORAGE_KEY, next)
		} catch {
			/* ignore */
		}
	}, [])

	const toggleLang = useCallback(
		() => setLang(lang === "es" ? "en" : "es"),
		[lang, setLang],
	)

	useEffect(() => {
		document.documentElement.lang = lang
		document.title = translate(lang, "meta.title")
	}, [lang])

	const t = useCallback(
		(key: DictKey, vars?: Vars) => translate(lang, key, vars),
		[lang],
	)

	const value = useMemo(
		() => ({ lang, setLang, toggleLang, t }),
		[lang, setLang, toggleLang, t],
	)

	return <LangContext value={value}>{children}</LangContext>
}
