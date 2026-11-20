import { docsHref } from '@avalon/registry'
import { AppShell, Card, DocsLink, SectionTitle, StorageUsage } from '@avalon/ui'
import { IconExternalLink } from '@tabler/icons-react'
import changelog from '../../../../CHANGELOG.md?raw'
import { Changelog } from '../Changelog.tsx'
import { APP_VERSION } from '../version.ts'

/** Home has no settings: the version, storage and the changelog live here. */
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
          </dl>
        </Card>
        <Card>
          <SectionTitle>儲存空間</SectionTitle>
          <StorageUsage />
        </Card>
        <Card>
          <SectionTitle>更新紀錄</SectionTitle>
          <Changelog source={changelog} />
          {/* Only the latest versions fit here; the docs keep every version (new tab). */}
          <DocsLink
            href={docsHref('changelog')}
            className="mt-3 flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-surface0 px-4 text-text transition-colors hover:bg-surface1 active:scale-[0.98]"
          >
            更多更新紀錄
            <IconExternalLink size={18} aria-hidden />
          </DocsLink>
        </Card>
      </div>
    </AppShell>
  )
}
