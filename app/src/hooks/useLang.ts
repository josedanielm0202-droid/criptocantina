import { use } from "react"
import { LangContext } from "../providers/LangProvider"

export const useLang = () => {
	const ctx = use(LangContext)
	if (!ctx) throw new Error("useLang must be used within a LangProvider")
	return ctx
}
