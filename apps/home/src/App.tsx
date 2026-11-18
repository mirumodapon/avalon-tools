import { useApplyGlobalTheme } from '@avalon/ui'
import { InfoPage } from './pages/InfoPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { ToolsPage } from './pages/ToolsPage.tsx'
import { useRoute } from './router.ts'

export function App() {
  useApplyGlobalTheme()
  const route = useRoute()
  switch (route.name) {
    case 'tools':
      return <ToolsPage />
    case 'info':
      return <InfoPage />
    default:
      return <NotFoundPage />
  }
}
