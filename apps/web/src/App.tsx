import { useGames } from './games/store.ts'
import { GameDetailPage } from './pages/GameDetailPage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { PlayPage } from './pages/PlayPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'
import { SetupPage } from './pages/SetupPage.tsx'
import { SummaryPage } from './pages/SummaryPage.tsx'
import { useRoute, type Route } from './router.ts'
import { useApplyTheme } from './settings/useApplyTheme.ts'

export function App() {
  useApplyTheme()
  const route = useRoute()
  const ready = useGames((s) => s.ready)
  const storageError = useGames((s) => s.storageError)
  const dismissError = useGames((s) => s.dismissError)
  return (
    <>
      {storageError && (
        <div
          role="alert"
          className="sticky top-0 z-40 flex items-center gap-2 bg-fail px-4 py-2 text-sm text-on-fill"
        >
          <span className="flex-1">{storageError}</span>
          <button
            type="button"
            className="min-h-9 rounded-lg px-2 underline"
            onClick={dismissError}
          >
            知道了
          </button>
        </div>
      )}
      {ready || route.name === 'settings' ? (
        <Routes route={route} />
      ) : (
        <p className="py-20 text-center text-subtext0">載入中…</p>
      )}
    </>
  )
}

function Routes({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <HomePage />
    case 'new':
      return <SetupPage key={route.from ?? 'new'} from={route.from} />
    case 'play':
      return <PlayPage key={route.id} id={route.id} />
    case 'summary':
      return <SummaryPage key={route.id} id={route.id} />
    case 'game':
      return <GameDetailPage key={route.id} id={route.id} />
    case 'settings':
      return <SettingsPage />
    default:
      return <NotFoundPage />
  }
}
