import { toolById } from '@avalon/registry'
import { AppShell, Card, useApplyGlobalTheme } from '@avalon/ui'

const TOOL = toolById('assistant')

export function App() {
  useApplyGlobalTheme()
  return (
    <AppShell title={TOOL.name}>
      <Card className="mt-2 text-subtext1">{TOOL.description}</Card>
    </AppShell>
  )
}
