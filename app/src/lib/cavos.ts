/**
 * Cavos: segunda forma de entrar (wallet embebida de Stellar con Google,
 * Apple o un código por correo). Este archivo es chiquito a propósito: NO
 * importa el kit de Cavos (~1 MB con sus dependencias). El kit se descarga
 * recién cuando la persona toca «Entrar con Cavos», cuando vuelve del login
 * (con ?cavos_auth_code en la URL) o si ya había entrado con Cavos antes.
 */

/** App ID del dashboard de Cavos (público, va en el bundle). */
export const CAVOS_APP_ID: string = (
	(import.meta.env.PUBLIC_CAVOS_APP_ID as string | undefined) ?? ""
).trim()

/** Sal fija de la app. NUNCA cambiarla: cambia las direcciones de todos. */
export const CAVOS_APP_SALT = "criptocantina"

export const cavosEnabled = (): boolean => CAVOS_APP_ID.length > 0

const FLAG = "cripto-cantina.cavos"

/** ¿La persona entró con Cavos en una visita anterior? */
export const hadCavos = (): boolean => {
	try {
		return localStorage.getItem(FLAG) === "1"
	} catch {
		return false
	}
}

export const rememberCavos = (on: boolean) => {
	try {
		if (on) localStorage.setItem(FLAG, "1")
		else localStorage.removeItem(FLAG)
	} catch {
		/* modo privado: no pasa nada */
	}
}

/** ¿Estamos volviendo del login de Google/Apple de Cavos? */
export const isCavosCallback = (): boolean => {
	try {
		const p = new URLSearchParams(location.search)
		return !!(p.get("cavos_auth_code") || p.get("auth_data"))
	} catch {
		return false
	}
}

/**
 * Pedido de «abrir Cavos» que puede llegar antes de que exista el proveedor
 * (p. ej. desde la barra liviana del intro). El WalletProvider lo consume.
 */
let pending = false
const listeners = new Set<() => void>()
export const requestCavos = () => {
	pending = true
	listeners.forEach((l) => l())
}
export const takeCavosRequest = (): boolean => {
	const p = pending
	pending = false
	return p
}
export const onCavosRequest = (l: () => void) => {
	listeners.add(l)
	return () => void listeners.delete(l)
}

/** Descarga el kit de Cavos (p. ej. al acercar el mouse al botón). */
export const preloadCavos = () => import("../components/cantina/CavosBridge")
