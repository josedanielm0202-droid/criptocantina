import { type DictKey } from "../i18n"

/** ID del contrato del libro de visitas en Testnet. */
export const CONTRACT_ID =
	"CCPGEQF44OMJGJWF7RV7PZA2XKUD2GCVH75A62FYHCBEKHL46UZQ5E3V"

export const MAX_BYTES = 280

const EXPLORER = "https://stellar.expert/explorer/testnet"
export const contractUrl = (id: string = CONTRACT_ID) =>
	`${EXPLORER}/contract/${id}`
export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`
export const accountUrl = (addr: string) => `${EXPLORER}/account/${addr}`

/**
 * El contrato mide `String::len()` en bytes UTF-8, así que contamos igual.
 */
export const byteLength = (s: string) => new TextEncoder().encode(s).length

/** Errores del contrato (`#[contracterror]`). */
const CONTRACT_ERRORS: Record<number, DictKey> = {
	1: "err.alreadySigned",
	2: "err.empty",
	3: "err.tooLong",
}
const CONTRACT_ERROR_NAMES: Record<string, DictKey> = {
	YaFirmo: "err.alreadySigned",
	MensajeVacio: "err.empty",
	MensajeMuyLargo: "err.tooLong",
}

export interface FriendlyError {
	key: DictKey
	/** Mensaje original, solo para `err.generic`. */
	raw?: string
}

const messageOf = (e: unknown): string => {
	if (e == null) return ""
	if (typeof e === "string") return e
	if (e instanceof Error) return `${e.name}: ${e.message}`
	if (typeof e === "object" && "message" in e) {
		const m = (e as { message: unknown }).message
		if (typeof m === "string") return m
	}
	try {
		return JSON.stringify(e)
	} catch {
		return String(e)
	}
}

/**
 * Traduce cualquier error (de simulación, de la wallet o de la red) a una
 * clave del diccionario para mostrar un mensaje amigable.
 */
export function mapError(e: unknown): FriendlyError {
	const msg = messageOf(e)

	// Err({ message: "YaFirmo" }) del cliente generado
	const named = CONTRACT_ERROR_NAMES[msg]
	if (named) return { key: named }

	// "Error(Contract, #1)" dentro de un error de simulación
	const m = /Error\(Contract, #(\d+)\)/.exec(msg)
	if (m?.[1]) {
		const k = CONTRACT_ERRORS[Number(m[1])]
		if (k) return { key: k }
	}

	const low = msg.toLowerCase()
	if (
		low.includes("userrejected") ||
		low.includes("rejected") ||
		low.includes("declined") ||
		low.includes("denied") ||
		low.includes("cancel")
	)
		return { key: "err.rejected" }
	if (
		low.includes("account not found") ||
		low.includes("fakeaccount") ||
		low.includes("does not exist")
	)
		return { key: "err.unfunded" }
	if (
		low.includes("network") &&
		(low.includes("passphrase") || low.includes("mismatch"))
	)
		return { key: "err.network" }
	if (low.includes("timeout") || low.includes("timed out"))
		return { key: "err.timeout" }

	return { key: "err.generic", raw: msg.slice(0, 160) }
}

/** Fecha legible desde el timestamp del ledger (segundos). */
export function formatFecha(fecha: bigint | number, lang: "es" | "en") {
	const ms = Number(fecha) * 1000
	return new Intl.DateTimeFormat(lang === "es" ? "es-CR" : "en-US", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(ms))
}
