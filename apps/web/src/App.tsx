import { HomePage } from './pages/HomePage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { PlayPage } from './pages/PlayPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'
import { SetupPage } from './pages/SetupPage.tsx'
import { useRoute } from './router.ts'
import { useApplyTheme } from './settings/useApplyTheme.ts'

export function App() {
  useApplyTheme()
  const route = useRoute()
  switch (route.name) {
    case 'home':
      return <HomePage />
    case 'new':
      return <SetupPage />
    case 'play':
      return <PlayPage key={route.id} id={route.id} />
    case 'settings':
      return <SettingsPage />
    default:
      return <NotFoundPage />
  }
}
