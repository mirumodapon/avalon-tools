import { builtTools } from '@avalon/registry'
import { AppShell, Card, SectionTitle, StorageUsage } from '@avalon/ui'
import changelog from '../../../../CHANGELOG.md?raw'
import { Changelog } from '../Changelog.tsx'
import { APP_VERSION } from '../version.ts'

/** Home has no settings: versions, storage and the changelog live here. */
export function InfoPage() {
  return (
    <AppShell title="資訊" homeHref={null} onBack={() => (window.location.hash = '#/')}>
      <div className="space-y-4 pt-2">
        <Card>
          <SectionTitle>版本</SectionTitle>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>阿瓦隆工具集</dt>
              <dd className="font-mono text-subtext1">{APP_VERSION}</dd>
            </div>
            {builtTools()
              .filter((t) => t.id !== 'home')
              .map((t) => (
                <div key={t.id} className="flex justify-between gap-2">
                  <dt>{t.name}</dt>
                  <dd className="font-mono text-subtext1">{t.version}</dd>
                </div>
              ))}
          </dl>
        </Card>
        <Card>
          <SectionTitle>儲存空間</SectionTitle>
          <StorageUsage />
        </Card>
        <Card>
          <SectionTitle>更新紀錄</SectionTitle>

          <Changelog source={changelog} />
        </Card>
      </div>
    </AppShell>
  )
}
