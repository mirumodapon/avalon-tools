import { IconArrowLeft, IconBuildingCastle } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { IconButton } from './ui.tsx'

/**
 * Page frame shared by every tool: sticky header with a link back to the 阿瓦隆工具集
 * home (a full page load, since home is a separate app), an optional in-app back
 * button, the title and actions.
 */
export function AppShell({
  title,
  onBack,
  actions,
  header,
  children,
  homeHref = '/',
}: {
  title: ReactNode
  /** In-app back navigation; omitted on a tool's top-level screen. */
  onBack?: () => void
  actions?: ReactNode
  /** Extra sticky content under the title bar. */
  header?: ReactNode
  children: ReactNode
  /** Where the home link points; `null` hides it (for the home app itself). */
  homeHref?: string | null
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="sticky top-0 z-30 bg-base/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex min-h-14 items-center gap-1 px-2">
          {homeHref !== null && (
            <a
              href={homeHref}
              aria-label="回到阿瓦隆工具集"
              title="回到阿瓦隆工具集"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-subtext1 hover:bg-surface0"
            >
              <IconBuildingCastle size={22} aria-hidden />
            </a>
          )}
          {onBack ? (
            <IconButton label="返回" onClick={onBack}>
              <IconArrowLeft size={22} />
            </IconButton>
          ) : (
            homeHref === null && <span className="w-2" />
          )}
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
          {actions}
        </div>
        {header}
      </header>
      <main className="flex flex-1 flex-col px-4 pb-4">{children}</main>
    </div>
  )
}
