import { useCallback, useState } from "react"
import { Route, Routes } from "react-router-dom"
import { GuideProvider } from "./components/cantina/Guide"
import { HelpPanel } from "./components/cantina/HelpPanel"
import { ScrollFX } from "./components/cantina/ScrollFX"
import { TopBar } from "./components/cantina/TopBar"
import Debug from "./pages/Debug"
import Home from "./pages/Home"

function App() {
	const [help, setHelp] = useState(false)
	const close = useCallback(() => setHelp(false), [])
	return (
		<GuideProvider>
			<ScrollFX />
			<TopBar onHelp={() => setHelp(true)} />
			<main className="page">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/debug" element={<Debug />} />
					<Route path="/debug/:contractName" element={<Debug />} />
				</Routes>
			</main>
			<HelpPanel open={help} onClose={close} />
		</GuideProvider>
	)
}

export default App
