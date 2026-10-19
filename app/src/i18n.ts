/**
 * Diccionario bilingüe (ES / EN) de la Cripto Cantina.
 * Todas las cadenas visibles de la UI viven aquí. Las claves de `es` definen
 * el tipo, así que si falta una traducción en `en` TypeScript lo marca.
 */

export type Lang = "es" | "en"

export const LANGS: Lang[] = ["es", "en"]

const es = {
	// Meta / barra superior
	"meta.title": "Cripto Cantina · Libro de visitas en Stellar",
	"nav.brand": "Cripto Cantina",
	"nav.connect": "Conectar wallet",
	"nav.loading": "Cargando…",
	"nav.fund": "Cargar XLM de prueba",
	"nav.funding": "Cargando…",
	"nav.help": "Ayuda",
	"nav.lang": "Cambiar idioma",
	"nav.network.ok": "Testnet",
	"nav.network.mismatch": "Red equivocada",
	"nav.network.unverified": "Red sin verificar",
	"nav.network.disconnected": "Sin conectar",
	"nav.network.title.ok": "Tu wallet está en {app}.",
	"nav.network.title.mismatch":
		"Tu wallet está en {wallet}. Cambiala a {app} en Freighter.",
	"nav.network.title.unverified":
		"Tu wallet no reporta su red: asegurate de que esté en {app}.",
	"nav.network.title.disconnected": "Conectá tu wallet en {app}.",
	"nav.profile": "Ver cuenta",

	// Intro (zoom a la pantalla)
	"intro.hello": "¡Hola! Soy tu guía. Bajá para entrar 👇",
	"intro.skip": "Saltar intro",
	"intro.cue": "Bajá para entrar",
	"intro.tag": "Libro de visitas en Stellar",
	"mood.neutral": "Neutral",
	"mood.triste": "Triste",
	"mood.enojado": "Enojado",
	"mood.emocionado": "Emocionado",
	"mood.sorprendido": "Sorprendido",
	"mood.divertido": "Divertido",
	"mood.determinado": "Determinado",
	"mood.nervioso": "Nervioso",
	"hero.studio": "dApp de libro de visitas · Soroban",
	"hero.nav.steps": "Recorrido",
	"hero.nav.sign": "Firmar",
	"hero.nav.book": "Libro",
	"hero.nav.contract": "Contrato",
	"hero.plate": "MASCOTA/01",
	"hero.expr": "EXPR",

	// Hero
	"hero.tag": "Libro de visitas · Stellar Testnet",
	"hero.line1": "Pasá adelante,",
	"hero.line2": "dejá tu firma",
	"hero.line3": "en la blockchain.",
	"hero.sub":
		"Un libro de visitas que vive en un contrato inteligente de Soroban. Cada firma queda grabada para siempre en la red de prueba de Stellar.",
	"hero.cta": "Entrar a la cantina",
	"hero.scroll": "bajá para entrar",
	"hero.cut": "cortar por la línea",
	"hero.stats.firmas": "firmas",
	"hero.stats.max": "caracteres máx.",
	"hero.stats.once": "firma por wallet",

	// Manifiesto
	"intro.kicker": "00 / La puerta",
	"intro.a": "Primero conectás tu wallet",
	"intro.b": "después dejás tu huella",
	"intro.c": "y la cantina la recuerda para siempre.",
	"intro.note":
		"Nada de dinero real: todo pasa en Testnet, con XLM de prueba que son gratis.",

	// Recorrido
	"steps.kicker": "El recorrido",
	"steps.title": "Cuatro pasos",
	"steps.titleItalic": "y estás adentro.",
	"steps.1.t": "Conectá",
	"steps.1.ti": "tu wallet",
	"steps.1.d":
		"Usá Freighter. Solo compartís tu dirección pública (la que empieza con G…).",
	"steps.2.t": "Revisá",
	"steps.2.ti": "la red",
	"steps.2.d":
		"Freighter tiene que estar en Testnet. Si tu cuenta no tiene fondos, la cargamos con XLM de prueba.",
	"steps.3.t": "Escribí",
	"steps.3.ti": "tu mensaje",
	"steps.3.d": "Hasta 280 caracteres. Un saludo, un chiste, un consejo.",
	"steps.4.t": "Firmá",
	"steps.4.ti": "el libro",
	"steps.4.d":
		"Freighter te pide aprobar. El contrato verifica que seas vos con require_auth.",

	// Formulario
	"form.kicker": "02 / Tu firma",
	"form.title": "Firmá el",
	"form.titleItalic": "libro de visitas",
	"form.ticket": "CANTINA/TKT.01",
	"form.tear": "rasgar por la línea",
	"form.label": "Tu mensaje",
	"form.placeholder": "¡Pura vida, Cantina! Pasé por aquí…",
	"form.counter": "{n}/{max}",
	"form.counterHint": "Se cuentan bytes: tildes y emojis ocupan más de uno.",
	"form.author": "Firmás como",
	"form.notConnected": "Conectá tu wallet para poder firmar.",
	"form.connect": "Conectar wallet",
	"form.submit": "Firmar el libro",
	"form.already": "Ya firmaste este libro ✓",
	"form.mismatch":
		"Tu Freighter está en otra red. Cambiala a Testnet para firmar.",
	"form.unfunded":
		"Tu cuenta no tiene XLM en Testnet. Cargala gratis para poder firmar.",
	"form.fund": "Cargar XLM de prueba",
	"form.state.preparing": "Preparando la transacción…",
	"form.state.waiting": "Esperando tu aprobación en Freighter…",
	"form.state.sending": "Enviando a la red de Stellar…",
	"form.state.success": "¡Firmado! Tu mensaje ya vive en la blockchain.",
	"form.state.viewTx": "Ver transacción en stellar.expert ↗",
	"form.state.again": "Listo",

	// Validación y errores
	"err.empty": "Escribí algo antes de firmar.",
	"err.tooLong":
		"Tu mensaje pasa de 280 caracteres (bytes). Recortalo un poco.",
	"err.alreadySigned":
		"Esta wallet ya firmó el libro. Solo se vale una firma por dirección.",
	"err.rejected":
		"Cancelaste la firma en Freighter. No pasó nada, podés intentarlo otra vez.",
	"err.network":
		"La wallet está en otra red. Cambiala a Testnet en Freighter e intentá de nuevo.",
	"err.unfunded":
		"Tu cuenta no existe todavía en Testnet. Cargala con XLM de prueba y volvé a intentar.",
	"err.noWallet": "Primero conectá tu wallet.",
	"wallet.noFreighter":
		"No encuentro Freighter en este navegador. Abrí la página en el perfil de Chrome donde la instalaste, desbloqueala y recargá. Tocá «Conectar wallet» otra vez para ver las demás wallets.",
	"err.timeout":
		"La red tardó demasiado en confirmar. Revisá el libro en unos segundos.",
	"err.generic": "Algo salió mal: {msg}",
	"err.list": "No pude leer el libro. Revisá tu conexión e intentá de nuevo.",
	"err.retry": "Reintentar",
	"fund.ok": "¡Listo! Tu cuenta tiene XLM de prueba.",
	"fund.fail": "No se pudo cargar la cuenta. Intentá de nuevo en un rato.",

	// Lista
	"list.subtitle": "Registro de visitantes",
	"list.bookTitle": "El libro de la Cantina",
	"list.bookRole": "libro",
	"list.addr": "Dirección:",
	"list.cover": "Portada",
	"list.pageOf": "Página {a} de {b}",
	"list.pagesOf": "Páginas {a}–{b} de {c}",
	"list.prev": "Página anterior",
	"list.next": "Página siguiente",
	"list.open": "Abrir el libro",
	"list.openHint": "Abrir",
	"list.hint": "Arrastrá la esquina o usá las flechas para pasar la página",
	"list.kicker": "03 / El libro",
	"list.title": "El libro",
	"list.titleItalic": "de la Cantina",
	"list.file": "libro.md",
	"list.loading": "Leyendo el libro desde la blockchain…",
	"list.empty": "Todavía nadie firmó… ¡sé el primero!",
	"list.count": "{n} firmas",
	"list.count1": "1 firma",
	"list.live": "en vivo",
	"list.you": "vos",
	"list.refresh": "Actualizar",

	// Contrato
	"contract.kicker": "04 / El contrato",
	"contract.title": "El cerebro",
	"contract.titleItalic": "de la cantina",
	"contract.desc":
		"Un contrato de Soroban con dos funciones: firmar (con require_auth y una firma por dirección) y listar. Este es su ID en Testnet:",
	"contract.copy": "Copiar ID",
	"contract.copied": "¡Copiado!",
	"contract.view": "Ver en stellar.expert ↗",
	"contract.coin": "Arrastrá la moneda",
	"contract.fn.firmar": "guarda tu mensaje si tu wallet lo aprueba",
	"contract.fn.listar": "devuelve todas las firmas",
	"contract.fn.evento": "evento que avisa cada firma nueva",

	// Footer
	"footer.made":
		"Hecho en Costa Rica con Scaffold Stellar · Soroban · Freighter",
	"footer.top": "Volver arriba ↑",
	"footer.lab": "Stellar Lab ↗",

	// Guía (burbujas rápidas)
	"guide.hello": "¡Hola! Bienvenido a la Cripto Cantina 👋",
	"guide.scroll": "Bajá conmigo, te enseño el lugar.",
	"guide.intro": "Aquí todo es de prueba: cero plata real.",
	"guide.steps": "Son solo cuatro pasos, ¡tranqui!",
	"guide.connect": "Conectá tu wallet aquí 👆",
	"guide.write": "Escribí tu mensaje aquí ✍️",
	"guide.mismatch": "¡Ojo! Tu Freighter no está en Testnet.",
	"guide.unfunded": "Tu cuenta está vacía. ¡Cargala gratis!",
	"guide.connected": "¡Wallet conectada! Ya casi.",
	"guide.signing": "Aprobá la firma en Freighter 💪",
	"guide.sending": "Enviando… ¡aguantá!",
	"guide.success": "¡Firmado! ¡Quedaste en la historia! 🎉",
	"guide.error": "Uy… algo falló. Leé el mensaje.",
	"guide.already": "Ya firmaste antes, ¡solo se vale una vez!",
	"guide.list": "Mirá quién más pasó por aquí 👀",
	"guide.empty": "¿Nadie? ¡Podés ser la primera firma!",
	"guide.newSig": "¡Llegó una firma nueva!",
	"guide.contract": "Este es el cerebro: el contrato.",
	"guide.coin": "¡Jeje, me mareo!",
	"guide.copied": "¡Copiado! Pegalo en tu README.",
	"guide.tap": "Tocá para cerrar",
	"guide.mascot": "Personaje guía de la Cripto Cantina",

	// Ayuda / FAQ
	"help.title": "dudas.md",
	"help.subtitle": "Preguntas rápidas, respuestas cortas.",
	"help.close": "Cerrar ayuda",
	"help.hi": "¡Hola! Tocá una pregunta y te la explico.",
	"help.q1": "¿Qué es la Cripto Cantina?",
	"help.a1":
		"Un libro de visitas que vive en la blockchain de Stellar. Conectás tu wallet, escribís un mensaje corto y lo firmás. Queda guardado en un contrato inteligente y cualquiera puede leerlo.",
	"help.q2": "¿Qué es una wallet y qué es Freighter?",
	"help.a2":
		"Una wallet es como tu llavero digital: guarda las llaves de tu cuenta de Stellar. Freighter es una wallet que se instala como extensión de Chrome, Brave o Firefox desde freighter.app. Al instalarla creás una cuenta y te da una frase secreta: guardala bien y nunca se la des a nadie.",
	"help.q3": "¿Cómo paso Freighter a Testnet?",
	"help.a3":
		"Abrí Freighter, tocá el ícono de la red (el globo arriba) y elegí «Test Net». Si estás en Mainnet, la página te avisa con un punto rojo junto a la red.",
	"help.q4": "¿Cómo consigo XLM de prueba?",
	"help.a4":
		"Cuando conectás tu wallet en Testnet y tu cuenta está vacía, aparece el botón «Cargar XLM de prueba». Usa Friendbot, el grifo oficial de Stellar, y te da 10 000 XLM de prueba gratis.",
	"help.q5": "¿Qué significa firmar? ¿Cuesta plata?",
	"help.a5":
		"Firmar es aprobar con tu wallet una transacción que dice «yo, esta dirección, dejo este mensaje». El contrato lo comprueba con require_auth. Se paga una comisión mínima, pero en XLM de prueba: no cuesta dinero real.",
	"help.q6": "¿Por qué solo puedo firmar una vez?",
	"help.a6":
		"El contrato guarda qué direcciones ya firmaron y rechaza una segunda firma de la misma wallet. Así el libro es justo: una voz por visitante.",
	"help.q7": "¿Qué es el contract ID?",
	"help.a7":
		"Es la dirección única del contrato en la red (empieza con C…). Con ella cualquier app o persona puede encontrarlo y usarlo. El de la cantina es: {id}",
	"help.q8": "¿Dónde veo mi transacción?",
	"help.a8":
		"Después de firmar te mostramos un enlace a stellar.expert, el explorador de bloques. También podés ver toda la actividad del contrato en su página.",
	"help.link.freighter": "Descargar Freighter ↗",
	"help.link.contract": "Ver el contrato en stellar.expert ↗",
} as const

export type DictKey = keyof typeof es
type Dict = Record<DictKey, string>

const en: Dict = {
	"meta.title": "Crypto Cantina · A guestbook on Stellar",
	"nav.brand": "Crypto Cantina",
	"nav.connect": "Connect wallet",
	"nav.loading": "Loading…",
	"nav.fund": "Get test XLM",
	"nav.funding": "Funding…",
	"nav.help": "Help",
	"nav.lang": "Change language",
	"nav.network.ok": "Testnet",
	"nav.network.mismatch": "Wrong network",
	"nav.network.unverified": "Network unverified",
	"nav.network.disconnected": "Not connected",
	"nav.network.title.ok": "Your wallet is on {app}.",
	"nav.network.title.mismatch":
		"Your wallet is on {wallet}. Switch it to {app} in Freighter.",
	"nav.network.title.unverified":
		"Your wallet doesn't report its network: make sure it's on {app}.",
	"nav.network.title.disconnected": "Connect your wallet on {app}.",
	"nav.profile": "View account",

	"intro.hello": "Hi! I'm your guide. Scroll to enter 👇",
	"intro.skip": "Skip intro",
	"intro.cue": "Scroll to enter",
	"intro.tag": "A guestbook on Stellar",
	"mood.neutral": "Neutral",
	"mood.triste": "Sad",
	"mood.enojado": "Angry",
	"mood.emocionado": "Excited",
	"mood.sorprendido": "Surprised",
	"mood.divertido": "Amused",
	"mood.determinado": "Determined",
	"mood.nervioso": "Nervous",
	"hero.studio": "Guestbook dApp · Soroban",
	"hero.nav.steps": "Journey",
	"hero.nav.sign": "Sign",
	"hero.nav.book": "Book",
	"hero.nav.contract": "Contract",
	"hero.plate": "MASCOT/01",
	"hero.expr": "EXPR",

	"hero.tag": "Guestbook · Stellar Testnet",
	"hero.line1": "Come on in,",
	"hero.line2": "leave your mark",
	"hero.line3": "on the blockchain.",
	"hero.sub":
		"A guestbook that lives in a Soroban smart contract. Every signature is recorded forever on Stellar's test network.",
	"hero.cta": "Enter the cantina",
	"hero.scroll": "scroll to enter",
	"hero.cut": "cut along the line",
	"hero.stats.firmas": "signatures",
	"hero.stats.max": "max characters",
	"hero.stats.once": "signature per wallet",

	"intro.kicker": "00 / The door",
	"intro.a": "First you connect your wallet",
	"intro.b": "then you leave your mark",
	"intro.c": "and the cantina remembers it forever.",
	"intro.note":
		"No real money involved: everything happens on Testnet, with free test XLM.",

	"steps.kicker": "The journey",
	"steps.title": "Four steps",
	"steps.titleItalic": "and you're in.",
	"steps.1.t": "Connect",
	"steps.1.ti": "your wallet",
	"steps.1.d":
		"Use Freighter. You only share your public address (the one starting with G…).",
	"steps.2.t": "Check",
	"steps.2.ti": "the network",
	"steps.2.d":
		"Freighter must be on Testnet. If your account has no funds, we top it up with test XLM.",
	"steps.3.t": "Write",
	"steps.3.ti": "your message",
	"steps.3.d": "Up to 280 characters. A greeting, a joke, some advice.",
	"steps.4.t": "Sign",
	"steps.4.ti": "the book",
	"steps.4.d":
		"Freighter asks you to approve. The contract checks it's really you with require_auth.",

	"form.kicker": "02 / Your signature",
	"form.title": "Sign the",
	"form.titleItalic": "guestbook",
	"form.ticket": "CANTINA/TKT.01",
	"form.tear": "tear along the line",
	"form.label": "Your message",
	"form.placeholder": "Pura vida, Cantina! I was here…",
	"form.counter": "{n}/{max}",
	"form.counterHint":
		"Bytes are counted: accents and emojis take more than one.",
	"form.author": "Signing as",
	"form.notConnected": "Connect your wallet to sign.",
	"form.connect": "Connect wallet",
	"form.submit": "Sign the book",
	"form.already": "You already signed this book ✓",
	"form.mismatch":
		"Your Freighter is on another network. Switch it to Testnet to sign.",
	"form.unfunded":
		"Your account has no XLM on Testnet. Fund it for free so you can sign.",
	"form.fund": "Get test XLM",
	"form.state.preparing": "Preparing the transaction…",
	"form.state.waiting": "Waiting for your approval in Freighter…",
	"form.state.sending": "Sending to the Stellar network…",
	"form.state.success": "Signed! Your message now lives on the blockchain.",
	"form.state.viewTx": "View transaction on stellar.expert ↗",
	"form.state.again": "Done",

	"err.empty": "Write something before signing.",
	"err.tooLong": "Your message is over 280 characters (bytes). Trim it a bit.",
	"err.alreadySigned":
		"This wallet already signed the book. Only one signature per address.",
	"err.rejected":
		"You cancelled the signature in Freighter. Nothing happened, you can try again.",
	"err.network":
		"Your wallet is on another network. Switch it to Testnet in Freighter and try again.",
	"err.unfunded":
		"Your account doesn't exist on Testnet yet. Fund it with test XLM and try again.",
	"err.noWallet": "Connect your wallet first.",
	"wallet.noFreighter":
		"I can't find Freighter in this browser. Open the page in the Chrome profile where you installed it, unlock it and reload. Tap “Connect wallet” again to see the other wallets.",
	"err.timeout":
		"The network took too long to confirm. Check the book in a few seconds.",
	"err.generic": "Something went wrong: {msg}",
	"err.list": "I couldn't read the book. Check your connection and try again.",
	"err.retry": "Retry",
	"fund.ok": "Done! Your account has test XLM.",
	"fund.fail": "Couldn't fund the account. Try again in a bit.",

	"list.subtitle": "Visitor log",
	"list.bookTitle": "The Cantina's Book",
	"list.bookRole": "book",
	"list.addr": "Address:",
	"list.cover": "Cover",
	"list.pageOf": "Page {a} of {b}",
	"list.pagesOf": "Pages {a}–{b} of {c}",
	"list.prev": "Previous page",
	"list.next": "Next page",
	"list.open": "Open the book",
	"list.openHint": "Open",
	"list.hint": "Drag the corner or use the arrows to turn the page",
	"list.kicker": "03 / The book",
	"list.title": "The Cantina's",
	"list.titleItalic": "Book",
	"list.file": "book.md",
	"list.loading": "Reading the book from the blockchain…",
	"list.empty": "Nobody has signed yet… be the first!",
	"list.count": "{n} signatures",
	"list.count1": "1 signature",
	"list.live": "live",
	"list.you": "you",
	"list.refresh": "Refresh",

	"contract.kicker": "04 / The contract",
	"contract.title": "The brain",
	"contract.titleItalic": "of the cantina",
	"contract.desc":
		"A Soroban contract with two functions: firmar (sign, with require_auth and one signature per address) and listar (list). This is its Testnet ID:",
	"contract.copy": "Copy ID",
	"contract.copied": "Copied!",
	"contract.view": "View on stellar.expert ↗",
	"contract.coin": "Drag the coin",
	"contract.fn.firmar": "stores your message if your wallet approves",
	"contract.fn.listar": "returns every signature",
	"contract.fn.evento": "event announcing each new signature",

	"footer.made":
		"Made in Costa Rica with Scaffold Stellar · Soroban · Freighter",
	"footer.top": "Back to top ↑",
	"footer.lab": "Stellar Lab ↗",

	"guide.hello": "Hi! Welcome to the Crypto Cantina 👋",
	"guide.scroll": "Scroll with me, I'll show you around.",
	"guide.intro": "Everything here is test-only: zero real money.",
	"guide.steps": "Just four steps, easy!",
	"guide.connect": "Connect your wallet here 👆",
	"guide.write": "Write your message here ✍️",
	"guide.mismatch": "Heads up! Your Freighter isn't on Testnet.",
	"guide.unfunded": "Your account is empty. Fund it for free!",
	"guide.connected": "Wallet connected! Almost there.",
	"guide.signing": "Approve the signature in Freighter 💪",
	"guide.sending": "Sending… hang on!",
	"guide.success": "Signed! You're part of history! 🎉",
	"guide.error": "Oops… something failed. Read the message.",
	"guide.already": "You signed before, only once allowed!",
	"guide.list": "Look who else stopped by 👀",
	"guide.empty": "Nobody? You can be the first!",
	"guide.newSig": "A new signature just arrived!",
	"guide.contract": "This is the brain: the contract.",
	"guide.coin": "Hehe, I'm getting dizzy!",
	"guide.copied": "Copied! Paste it in your README.",
	"guide.tap": "Tap to close",
	"guide.mascot": "Crypto Cantina guide character",

	"help.title": "faq.md",
	"help.subtitle": "Quick questions, short answers.",
	"help.close": "Close help",
	"help.hi": "Hi! Tap a question and I'll explain it.",
	"help.q1": "What is the Crypto Cantina?",
	"help.a1":
		"A guestbook that lives on the Stellar blockchain. You connect your wallet, write a short message and sign it. It's stored in a smart contract and anyone can read it.",
	"help.q2": "What is a wallet, and what is Freighter?",
	"help.a2":
		"A wallet is like your digital keyring: it holds the keys to your Stellar account. Freighter is a wallet you install as a Chrome, Brave or Firefox extension from freighter.app. When you install it you create an account and get a secret phrase: keep it safe and never share it.",
	"help.q3": "How do I switch Freighter to Testnet?",
	"help.a3":
		"Open Freighter, tap the network icon (the globe at the top) and choose \u201cTest Net\u201d. If you're on Mainnet, this page warns you with a red dot next to the network.",
	"help.q4": "How do I get test XLM?",
	"help.a4":
		"When you connect your wallet on Testnet and the account is empty, a \u201cGet test XLM\u201d button appears. It uses Friendbot, Stellar's official faucet, and gives you 10,000 free test XLM.",
	"help.q5": "What does signing mean? Does it cost money?",
	"help.a5":
		"Signing means approving, with your wallet, a transaction that says \u201cI, this address, leave this message\u201d. The contract checks it with require_auth. There's a tiny fee, but it's paid in test XLM: it costs no real money.",
	"help.q6": "Why can I only sign once?",
	"help.a6":
		"The contract remembers which addresses already signed and rejects a second signature from the same wallet. That keeps the book fair: one voice per visitor.",
	"help.q7": "What is the contract ID?",
	"help.a7":
		"It's the contract's unique address on the network (it starts with C…). Any app or person can find and use the contract with it. The cantina's is: {id}",
	"help.q8": "Where can I see my transaction?",
	"help.a8":
		"After signing we show you a link to stellar.expert, the block explorer. You can also see all of the contract's activity on its page.",
	"help.link.freighter": "Get Freighter ↗",
	"help.link.contract": "View the contract on stellar.expert ↗",
}

export const dictionaries: Record<Lang, Dict> = { es, en }

export type Vars = Record<string, string | number>

export function translate(lang: Lang, key: DictKey, vars?: Vars): string {
	let s: string = dictionaries[lang][key] ?? dictionaries.es[key] ?? key
	if (vars) {
		for (const [k, v] of Object.entries(vars)) {
			s = s.split(`{${k}}`).join(String(v))
		}
	}
	return s
}

export const LANG_STORAGE_KEY = "cripto-cantina.lang"

export function initialLang(): Lang {
	try {
		const saved = localStorage.getItem(LANG_STORAGE_KEY)
		if (saved === "es" || saved === "en") return saved
	} catch {
		/* localStorage no disponible */
	}
	return "es"
}
