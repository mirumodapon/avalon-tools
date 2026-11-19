import { useApplyGlobalTheme } from '@avalon/ui'
import { startDeal } from './flow/start.ts'
import { useFlow } from './flow/store.ts'
import { useLady } from './lady/store.ts'
import { useQuest } from './quest/store.ts'
import { DealPage } from './pages/DealPage.tsx'
import { HistoryPage } from './pages/HistoryPage.tsx'
import { LadyPage } from './pages/LadyPage.tsx'
import { QuestPage } from './pages/QuestPage.tsx'
import { RecordPage } from './pages/RecordPage.tsx'
import { SetupPage } from './pages/SetupPage.tsx'
import { navigate, useRoute } from './router.ts'
import { useSettings } from './settings.ts'

const deal = () => startDeal(useSettings.getState().settings)
const redeal = () => {
  navigate({ name: 'setup' })
  void deal()
}

export function App() {
  useApplyGlobalTheme()
  const route = useRoute()
  const flow = useFlow((s) => s.flow)
  const quest = useQuest((s) => s.flow)
  const lady = useLady((s) => s.flow)

  // The three modes are independent. While one is running (and on its end screen),
  // only it is reachable; during a deal that keeps the history out of reach too.
  if (flow.step !== 'idle') return <DealPage onRedeal={redeal} />
  if (quest.step !== 'setup') return <QuestPage />
  if (lady.step !== 'idle') return <LadyPage />

  switch (route.name) {
    case 'history':
      return <HistoryPage />
    case 'record':
      return <RecordPage id={route.id} />
    case 'setup':
      return <SetupPage onStart={deal} />
  }
}
