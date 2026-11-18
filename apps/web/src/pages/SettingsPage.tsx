import { Page } from '../components/Layout.tsx'
import { ThemePicker } from '../components/ThemePicker.tsx'
import { Card, SectionTitle } from '../components/ui.tsx'

export function SettingsPage() {
  return (
    <Page title="設定" back={{ name: 'home' }}>
      <div className="space-y-4 pt-2">
        <Card>
          <SectionTitle>主題</SectionTitle>
          <ThemePicker />
        </Card>
      </div>
    </Page>
  )
}
