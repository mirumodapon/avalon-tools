import { useApplyGlobalTheme } from '@avalon/ui'
import { DealPage } from './pages/DealPage.tsx'
import { PlayPage } from './pages/PlayPage.tsx'
import { SetupPage } from './pages/SetupPage.tsx'
import { useSession } from './session/store.ts'

/** One screen per stage of the game in progress; no game → 開局. */
export function App() {
  useApplyGlobalTheme()
  const session = useSession((s) => s.session)
  if (!session) return <SetupPage />
  if (session.stage === 'deal') return <DealPage session={session} />
  return <PlayPage session={session} />
}
