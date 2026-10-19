import { shortAddress } from "@stellar-scaffold/app-lib"
import { guestbook } from "@stellar-scaffold/app-lib/clients"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { FIRMAS_KEY, type FirmaUI } from "../../hooks/useFirmas"
import { useInView } from "../../hooks/useInView"
import { useLang } from "../../hooks/useLang"
import { useWallet } from "../../hooks/useWallet"
import {
	byteLength,
	type FriendlyError,
	MAX_BYTES,
	mapError,
	txUrl,
} from "../../lib/guestbook"
import { useGuide } from "./Guide"
import { ConnectButton, FundButton, useAccountState } from "./TopBar"

type Phase =
	| { s: "idle" }
	| { s: "preparing" }
	| { s: "waiting" }
	| { s: "sending" }
	| { s: "success"; hash?: string }
	| { s: "error"; err: FriendlyError }

export function SignForm({ firmas }: { firmas: FirmaUI[] | undefined }) {
	const { t } = useLang()
	const guide = useGuide()
	const qc = useQueryClient()
	const { signTransaction, updateBalances } = useWallet()
	const { address, net, funded } = useAccountState()
	const [mensaje, setMensaje] = useState("")
	const [phase, setPhase] = useState<Phase>({ s: "idle" })
	const ref = useRef<HTMLDivElement>(null)
	const inView = useInView(ref, { threshold: 0.45 })

	const bytes = byteLength(mensaje.trim())
	const tooLong = bytes > MAX_BYTES
	const already = Boolean(address && firmas?.some((f) => f.autor === address))
	const busy =
		phase.s === "preparing" || phase.s === "waiting" || phase.s === "sending"

	// Burbujas del guía según el contexto
	useEffect(() => {
		if (!inView) return
		if (!address) guide.sayOnce("form-connect", "guide.connect", "neutral")
		else guide.sayOnce("form-write", "guide.write", "divertido")
	}, [inView, address, guide])

	useEffect(() => {
		if (!address) return
		if (net.state === "mismatch") {
			guide.say("guide.mismatch", "nervioso", 4200)
			return
		}
		// esperamos un toque a que lleguen los balances antes de decir "vacía"
		const id = setTimeout(() => {
			if (!funded)
				guide.sayOnce(`unfunded-${address}`, "guide.unfunded", "sorprendido")
			else
				guide.sayOnce(
					`connected-${address}`,
					"guide.connected",
					"emocionado",
					2800,
				)
		}, 1800)
		return () => clearTimeout(id)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [address, net.state, funded])

	const fail = (e: unknown) => {
		const err = mapError(e)
		console.error(e)
		setPhase({ s: "error", err })
		if (err.key === "err.alreadySigned")
			guide.say("guide.already", "triste", 4200)
		else if (err.key === "err.rejected")
			guide.say("err.rejected", "triste", 3600)
		else guide.say("guide.error", "nervioso", 3600)
	}

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (busy) return
		const msg = mensaje.trim()
		if (!address) return setPhase({ s: "error", err: { key: "err.noWallet" } })
		if (!msg) return setPhase({ s: "error", err: { key: "err.empty" } })
		if (tooLong) return setPhase({ s: "error", err: { key: "err.tooLong" } })
		if (already) return fail("YaFirmo")

		try {
			setPhase({ s: "preparing" })
			guide.mood("determinado", 0)
			const build = () =>
				guestbook.firmar(
					{ autor: address, mensaje: msg },
					{ publicKey: address },
				)
			let tx: Awaited<ReturnType<typeof build>>
			try {
				tx = await build()
			} catch (e) {
				// A veces un nodo RPC todavía no ve una cuenta recién cargada: reintento una vez
				if (!/account not found/i.test(String(e))) throw e
				await new Promise((r) => setTimeout(r, 1500))
				tx = await build()
			}
			// La simulación ya detecta YaFirmo / MensajeVacio / MensajeMuyLargo.
			// El cliente generado devuelve Err({ message: "" }), así que leemos el
			// código ("Error(Contract, #n)") del error de simulación.
			const sim = tx.result
			if (sim.isErr()) {
				const raw = (tx.simulation as { error?: string } | undefined)?.error
				throw new Error(raw ?? JSON.stringify(sim.unwrapErr()))
			}

			setPhase({ s: "waiting" })
			guide.say("guide.signing", "determinado", 6000)
			await tx.sign({ signTransaction })

			setPhase({ s: "sending" })
			guide.say("guide.sending", "nervioso", 6000)
			const sent = await tx.send()
			const res = sent.result
			if (res.isErr()) throw new Error(JSON.stringify(res.unwrapErr()))

			const hash =
				sent.sendTransactionResponse?.hash ??
				sent.getTransactionResponse?.txHash
			setPhase({ s: "success", hash })
			setMensaje("")
			guide.say("guide.success", "emocionado", 5200)
			void qc.invalidateQueries({ queryKey: FIRMAS_KEY })
			void updateBalances()
		} catch (err) {
			guide.mood("neutral", 0)
			fail(err)
		}
	}

	const errorText = (err: FriendlyError) =>
		err.key === "err.generic"
			? t("err.generic", { msg: err.raw ?? "" })
			: t(err.key)

	let gate: React.ReactNode = null
	if (!address)
		gate = (
			<div className="ticket__gate">
				<p>{t("form.notConnected")}</p>
				<ConnectButton />
			</div>
		)
	else if (net.state === "mismatch")
		gate = (
			<div className="ticket__gate ticket__gate--warn">
				<p>{t("form.mismatch")}</p>
			</div>
		)
	else if (!funded)
		gate = (
			<div className="ticket__gate">
				<p>{t("form.unfunded")}</p>
				<FundButton />
			</div>
		)

	return (
		<div className="ticket" ref={ref} data-reveal>
			<div className="ticket__head mono">
				<span>{t("form.ticket")}</span>
				<span>#{String((firmas?.length ?? 0) + 1).padStart(4, "0")}</span>
			</div>
			<form className="ticket__form" onSubmit={(e) => void submit(e)}>
				<label htmlFor="mensaje" className="ticket__label mono">
					{t("form.label")}
				</label>
				<textarea
					id="mensaje"
					value={mensaje}
					onChange={(e) => {
						setMensaje(e.target.value)
						if (phase.s === "error" || phase.s === "success")
							setPhase({ s: "idle" })
					}}
					placeholder={t("form.placeholder")}
					rows={4}
					disabled={busy || already}
					aria-invalid={tooLong}
					aria-describedby="mensaje-count"
				/>
				<div className="ticket__meta">
					<span className="mono ticket__author">
						{address ? (
							<>
								{t("form.author")} <b>{shortAddress(address)}</b>
							</>
						) : (
							"—"
						)}
					</span>
					<span
						id="mensaje-count"
						className={`mono counter ${tooLong ? "counter--over" : bytes > MAX_BYTES * 0.85 ? "counter--near" : ""}`}
						title={t("form.counterHint")}
					>
						{t("form.counter", { n: bytes, max: MAX_BYTES })}
					</span>
				</div>
				<div
					className={`counter-bar ${tooLong ? "counter-bar--over" : bytes > MAX_BYTES * 0.85 ? "counter-bar--near" : ""}`}
					aria-hidden
				>
					<span
						style={{
							transform: `scaleX(${Math.min(1, bytes / MAX_BYTES).toFixed(3)})`,
						}}
					/>
				</div>

				{gate ?? (
					<button
						type="submit"
						className={`btn btn--sign ${busy ? "is-busy" : ""}`}
						disabled={busy || already || !mensaje.trim() || tooLong}
					>
						{already
							? t("form.already")
							: busy
								? t(`form.state.${phase.s}` as "form.state.waiting")
								: t("form.submit")}
						{busy && <span className="spinner" />}
					</button>
				)}

				<div className="ticket__status" aria-live="polite">
					{busy && (
						<ol className="steps-mini mono">
							{(["preparing", "waiting", "sending"] as const).map((s) => (
								<li
									key={s}
									className={
										phase.s === s
											? "is-now"
											: ["preparing", "waiting", "sending"].indexOf(phase.s) >
												  ["preparing", "waiting", "sending"].indexOf(s)
												? "is-done"
												: ""
									}
								>
									{t(`form.state.${s}`)}
								</li>
							))}
						</ol>
					)}
					{phase.s === "success" && (
						<div className="status status--ok">
							<p>{t("form.state.success")}</p>
							{phase.hash && (
								<a href={txUrl(phase.hash)} target="_blank" rel="noreferrer">
									{t("form.state.viewTx")}
								</a>
							)}
						</div>
					)}
					{phase.s === "error" && (
						<div className="status status--err" role="alert">
							<p>{errorText(phase.err)}</p>
						</div>
					)}
				</div>
			</form>
			<div className="ticket__tear mono" aria-hidden>
				<span>✂</span>
				<span>{t("form.tear")}</span>
			</div>
		</div>
	)
}
