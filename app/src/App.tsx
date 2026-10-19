import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useCallback, useLayoutEffect, useState } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { HelpPanel } from "./components/cantina/HelpPanel"
import { TopBar } from "./components/cantina/TopBar"
import Debug from "./pages/Debug"
import Home from "./pages/Home"
import { WalletProvider } from "./providers/WalletProvider"

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: false,
		},
	},
})

/**
 * El resto de la app (se carga después del intro, ver AppShell). El intro
 * (Dive) ya está montado por AppShell al principio de <main>; esto agrega la
 * barra real, las secciones y el panel de ayuda.
 */
function App({ onReady }: { onReady: () => void }) {
	const [help, setHelp] = useState(false)
	const close = useCallback(() => setHelp(false), [])
	// La barra real reemplaza a la liviana en el mismo frame (sin parpadeo)
	useLayoutEffect(() => onReady(), [onReady])
	return (
		<QueryClientProvider client={queryClient}>
			<WalletProvider>
				<BrowserRouter basename={import.meta.env.BASE_URL}>
					<TopBar onHelp={() => setHelp(true)} />
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/debug" element={<Debug />} />
						<Route path="/debug/:contractName" element={<Debug />} />
					</Routes>
					<HelpPanel open={help} onClose={close} />
				</BrowserRouter>
			</WalletProvider>
		</QueryClientProvider>
	)
}

export default App
