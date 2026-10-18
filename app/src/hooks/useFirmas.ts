import { guestbook } from "@stellar-scaffold/app-lib/clients"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { CONTRACT_ID } from "../lib/guestbook"
import { useSubscription } from "./useSubscription"

export interface FirmaUI {
	autor: string
	mensaje: string
	fecha: bigint
}

export const FIRMAS_KEY = ["guestbook", "firmas"] as const

/** Lee todas las firmas (simulación de `listar`, no cuesta nada). */
export function useFirmas() {
	return useQuery({
		queryKey: FIRMAS_KEY,
		queryFn: async (): Promise<FirmaUI[]> => {
			const tx = await guestbook.listar()
			const list = tx.result.map((f) => ({
				autor: f.autor,
				mensaje: f.mensaje,
				fecha: BigInt(f.fecha),
			}))
			// lo más nuevo primero
			return list.sort((a, b) =>
				a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0,
			)
		},
		refetchInterval: 60_000,
	})
}

/** Escucha el evento `firmado` del contrato y refresca la lista en vivo. */
export function useFirmadoLive(onNew?: () => void) {
	const qc = useQueryClient()
	const handler = useCallback(() => {
		void qc.invalidateQueries({ queryKey: FIRMAS_KEY })
		onNew?.()
	}, [qc, onNew])
	useSubscription(CONTRACT_ID, "firmado", handler, 6000)
}
