import { useApplyGlobalTheme } from '@avalon/ui'
import { isDealing } from './flow/machine.ts'
import { startDeal } from './flow/start.ts'
import { useFlow } from './flow/store.ts'
import { DealPage } from './pages/DealPage.tsx'
import { HistoryPage } from './pages/HistoryPage.tsx'
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

  // While someone still has to see their card, only the deal is reachable:
  // the history (this deal's result included) stays out of reach.
  if (isDealing(flow)) return <DealPage onRedeal={redeal} />
  if (flow.step === 'done' && route.name === 'setup') return <DealPage onRedeal={redeal} />

  switch (route.name) {
    case 'history':
      return <HistoryPage />
    case 'record':
      return <RecordPage id={route.id} />
    case 'setup':
      return <SetupPage onStart={deal} />
  }
}
