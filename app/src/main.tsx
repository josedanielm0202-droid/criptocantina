import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./styles/cantina.css"
import { AppShell } from "./AppShell.tsx"
import { GuideProvider } from "./components/cantina/Guide.tsx"
import { LangProvider } from "./providers/LangProvider.tsx"
import { NotificationProvider } from "./providers/NotificationProvider.tsx"

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<LangProvider>
			<NotificationProvider>
				<GuideProvider>
					<AppShell />
				</GuideProvider>
			</NotificationProvider>
		</LangProvider>
	</StrictMode>,
)
