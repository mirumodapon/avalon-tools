import { listedTools, type ToolMeta } from '@avalon/registry'
import { AppShell, Card, cx, IconButton } from '@avalon/ui'
import { IconChevronRight, IconDeviceMobileDown, IconInfoCircle } from '@tabler/icons-react'
import { TOOL_ICONS } from '../toolIcons.ts'

const STATUS_LABEL: Partial<Record<ToolMeta['status'], string>> = {
  beta: 'Beta',
  'coming-soon': '即將推出',
}

function isStandalone(): boolean {
  try {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches === true ||
      (navigator as { standalone?: boolean }).standalone === true
    )
  } catch {
    return false
  }
}

function ToolCard({ tool }: { tool: ToolMeta }) {
  const Icon = TOOL_ICONS[tool.icon]
  const soon = tool.status === 'coming-soon'
  const status = STATUS_LABEL[tool.status]
  const body = (
    <>
      <span
        data-accent={tool.accent}
        className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-fg"
        aria-hidden
      >
        {Icon && <Icon size={28} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-semibold">{tool.name}</span>
          {status && (
            <span className="rounded-full bg-surface1 px-2 py-0.5 text-xs text-subtext1">
              {status}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-subtext0">{tool.description}</span>
      </span>
      {!soon && <IconChevronRight size={20} className="shrink-0 text-overlay1" aria-hidden />}
    </>
  )
  const cls = 'flex min-h-20 items-center gap-3 rounded-2xl bg-mantle p-4 text-left'
  // Tools are separate apps: a plain link loads them in full (no SPA routing across apps).
  return soon ? (
    <div aria-disabled="true" className={cx(cls, 'opacity-55')}>
      {body}
    </div>
  ) : (
    <a href={tool.path} className={cx(cls, 'hover:bg-surface0')}>
      {body}
    </a>
  )
}

export function ToolsPage() {
  const tools = listedTools()
  return (
    <AppShell
      title="阿瓦隆工具集"
      homeHref={null}
      actions={
        <IconButton label="資訊" onClick={() => (window.location.hash = '#/info')}>
          <IconInfoCircle size={22} />
        </IconButton>
      }
    >
      <div className="space-y-4 pt-2">
        <p className="text-subtext1">《阿瓦隆》桌遊的輔助工具。點選工具開始使用。</p>
        <ul className="space-y-3" aria-label="工具">
          {tools.map((t) => (
            <li key={t.id}>
              <ToolCard tool={t} />
            </li>
          ))}
        </ul>
        {!isStandalone() && (
          <Card className="flex gap-3 text-sm text-subtext1">
            <IconDeviceMobileDown size={22} className="shrink-0 text-accent-fg" aria-hidden />
            <p>
              每個工具都可以單獨安裝成 App：打開工具後，從瀏覽器選單選擇「加入主畫面」或「安裝」。
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
