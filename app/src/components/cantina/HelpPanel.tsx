import { useEffect, useRef, useState } from "react"
import { useLang } from "../../hooks/useLang"
import { type DictKey } from "../../i18n"
import { CONTRACT_ID, contractUrl } from "../../lib/guestbook"
import { lockScroll } from "../../lib/smooth"
import { type Expression, Mascot } from "./Mascot"

const QUESTIONS: {
	n: number
	e: Expression
	link?: { href: string; key: DictKey }
}[] = [
	{ n: 1, e: "emocionado" },
	{
		n: 2,
		e: "divertido",
		link: { href: "https://www.freighter.app/", key: "help.link.freighter" },
	},
	{ n: 3, e: "determinado" },
	{ n: 4, e: "emocionado" },
	{ n: 5, e: "sorprendido" },
	{ n: 6, e: "nervioso" },
	{
		n: 7,
		e: "divertido",
		link: { href: contractUrl(), key: "help.link.contract" },
	},
	{
		n: 8,
		e: "sorprendido",
		link: { href: contractUrl(), key: "help.link.contract" },
	},
]

export function HelpPanel({
	open,
	onClose,
}: {
	open: boolean
	onClose: () => void
}) {
	const { t } = useLang()
	const [active, setActive] = useState<number | null>(null)
	const closeRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		if (!open) return
		closeRef.current?.focus()
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
		window.addEventListener("keydown", onKey)
		lockScroll(true)
		return () => {
			window.removeEventListener("keydown", onKey)
			lockScroll(false)
		}
	}, [open, onClose])

	const current = QUESTIONS.find((q) => q.n === active)
	const expression: Expression = current?.e ?? "neutral"
	const bubble = current ? t(`help.q${current.n}` as DictKey) : t("help.hi")

	let line = 0
	const ln = () => (line += 1)

	return (
		<div className={`help ${open ? "help--open" : ""}`} aria-hidden={!open}>
			<div className="help__scrim" onClick={onClose} />
			<aside
				className="help__panel"
				role="dialog"
				aria-modal="true"
				aria-label={t("help.title")}
			>
				<div className="help__tabs">
					<span className="dots">
						<i />
						<i />
						<i />
					</span>
					<span className="help__file mono">{t("help.title")}</span>
					<button
						ref={closeRef}
						type="button"
						className="help__close"
						onClick={onClose}
						aria-label={t("help.close")}
						tabIndex={open ? 0 : -1}
					>
						×
					</button>
				</div>

				<div className="help__guide">
					<Mascot expression={expression} size={92} />
					<p className="help__say" key={bubble}>
						{bubble}
					</p>
				</div>

				<div className="help__body" data-lenis-prevent>
					<p className="help__line help__line--muted">
						<span className="ln">{ln()}</span>
						<span>{"<!-- " + t("help.subtitle") + " -->"}</span>
					</p>
					{QUESTIONS.map((q) => {
						const isOpen = active === q.n
						return (
							<div key={q.n} className={`faq ${isOpen ? "faq--open" : ""}`}>
								<button
									type="button"
									className="help__line faq__q"
									aria-expanded={isOpen}
									onClick={() => setActive(isOpen ? null : q.n)}
									tabIndex={open ? 0 : -1}
								>
									<span className="ln">{ln()}</span>
									<span>
										<b className="hash"># </b>
										{t(`help.q${q.n}` as DictKey)}
									</span>
									<span className="faq__chev">{isOpen ? "−" : "+"}</span>
								</button>
								<div className="faq__a">
									<div>
										<p className="help__line">
											<span className="ln">{ln()}</span>
											<span>
												{t(`help.a${q.n}` as DictKey, { id: CONTRACT_ID })}
											</span>
										</p>
										{q.link && (
											<p className="help__line">
												<span className="ln">{ln()}</span>
												<a
													href={q.link.href}
													target="_blank"
													rel="noreferrer"
													tabIndex={isOpen ? 0 : -1}
												>
													{t(q.link.key)}
												</a>
											</p>
										)}
									</div>
								</div>
								<p className="help__line help__line--muted">
									<span className="ln">{ln()}</span>
									<span>---</span>
								</p>
							</div>
						)
					})}
				</div>
			</aside>
		</div>
	)
}
