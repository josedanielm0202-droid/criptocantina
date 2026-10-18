import { shortAddress } from "@stellar-scaffold/app-lib"
import { type UseQueryResult } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { type FirmaUI } from "../../hooks/useFirmas"
import { useInView } from "../../hooks/useInView"
import { useLang } from "../../hooks/useLang"
import { useWallet } from "../../hooks/useWallet"
import { accountUrl, formatFecha } from "../../lib/guestbook"
import { useGuide } from "./Guide"

export function SignatureList({ query }: { query: UseQueryResult<FirmaUI[]> }) {
	const { t, lang } = useLang()
	const { address } = useWallet()
	const guide = useGuide()
	const ref = useRef<HTMLDivElement>(null)
	const inView = useInView(ref, { threshold: 0.3 })
	const { data, isLoading, isError, refetch, isFetching } = query

	useEffect(() => {
		if (!inView || isLoading) return
		if (data && data.length === 0)
			guide.sayOnce("list-empty", "guide.empty", "sorprendido")
		else guide.sayOnce("list", "guide.list", "divertido")
	}, [inView, isLoading, data, guide])

	let line = 0
	const ln = () => String((line += 1)).padStart(2, " ")
	const count = data?.length ?? 0

	return (
		<div className="editor" ref={ref} data-reveal>
			<div className="editor__tabs">
				<span className="dots">
					<i />
					<i />
					<i />
				</span>
				<span className="editor__file mono">{t("list.file")}</span>
				<span className="editor__live mono">
					<span className="live-dot" /> {t("list.live")}
				</span>
				<button
					type="button"
					className="editor__refresh mono"
					aria-label={t("list.refresh")}
					onClick={() => void refetch()}
					disabled={isFetching}
				>
					↻ <span className="hide-sm">{t("list.refresh")}</span>
				</button>
			</div>
			<div className="editor__body">
				<p className="code-line code-line--muted">
					<span className="ln">{ln()}</span>
					<span>
						{"# "}
						{count === 1 ? t("list.count1") : t("list.count", { n: count })}
					</span>
				</p>
				{isLoading && (
					<p className="code-line">
						<span className="ln">{ln()}</span>
						<span className="shimmer">{t("list.loading")}</span>
					</p>
				)}
				{isError && (
					<div className="code-line code-line--err">
						<span className="ln">{ln()}</span>
						<span>
							{t("err.list")}{" "}
							<button
								type="button"
								className="link-btn"
								onClick={() => void refetch()}
							>
								{t("err.retry")}
							</button>
						</span>
					</div>
				)}
				{data && data.length === 0 && (
					<p className="code-line code-line--empty">
						<span className="ln">{ln()}</span>
						<span>{"> " + t("list.empty")}</span>
					</p>
				)}
				{data?.map((f, i) => (
					<article
						key={`${f.autor}-${String(f.fecha)}`}
						className={`entry ${f.autor === address ? "entry--me" : ""}`}
						data-reveal
						style={{ ["--d" as string]: `${Math.min(i, 8) * 60}ms` }}
					>
						<p className="code-line">
							<span className="ln">{ln()}</span>
							<span className="entry__head">
								<b className="hash">## </b>
								<a
									href={accountUrl(f.autor)}
									target="_blank"
									rel="noreferrer"
									className="mono"
								>
									{shortAddress(f.autor)}
								</a>
								{f.autor === address && (
									<span className="tag">{t("list.you")}</span>
								)}
								<time className="entry__date mono">
									{formatFecha(f.fecha, lang)}
								</time>
							</span>
						</p>
						<p className="code-line">
							<span className="ln">{ln()}</span>
							<span className="entry__msg">{f.mensaje}</span>
						</p>
						<p className="code-line code-line--muted">
							<span className="ln">{ln()}</span>
							<span>---</span>
						</p>
					</article>
				))}
			</div>
		</div>
	)
}
