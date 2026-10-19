import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "./styles/cantina.css"
import App from "./App.tsx"
import { LangProvider } from "./providers/LangProvider.tsx"
import { NotificationProvider } from "./providers/NotificationProvider.tsx"
import { WalletProvider } from "./providers/WalletProvider.tsx"

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: false,
		},
	},
})

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<LangProvider>
			<NotificationProvider>
				<QueryClientProvider client={queryClient}>
					<WalletProvider>
						<BrowserRouter basename={import.meta.env.BASE_URL}>
							<App />
						</BrowserRouter>
					</WalletProvider>
				</QueryClientProvider>
			</NotificationProvider>
		</LangProvider>
	</StrictMode>,
)
