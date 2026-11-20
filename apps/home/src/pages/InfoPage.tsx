import { builtTools, docsHref, manifestName } from '@avalon/registry'
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
          <SectionTitle>授權</SectionTitle>
          <p className="text-sm text-subtext1">
            阿瓦隆工具集以 MIT 授權釋出。各工具使用的第三方套件與授權條款：
          </p>
          {/* Every app ships its own notices (licenses.txt), generated at build time. */}
          <ul className="mt-2 space-y-1 text-sm" aria-label="第三方授權">
            {builtTools().map((t) => (
              <li key={t.id}>
                <a
                  href={`${t.path}licenses.txt`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex min-h-9 items-center gap-1 text-accent-fg underline-offset-2 hover:underline"
                >
                  {manifestName(t)}
                  <IconExternalLink size={14} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
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
