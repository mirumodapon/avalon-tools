import { IconArrowLeft, IconBuildingCastle, IconHelpCircle } from '@tabler/icons-react'
import { useState, type ReactNode } from 'react'
import { canLinkHome } from './standalone.ts'
import { IconButton } from './ui.tsx'

/**
 * Page frame shared by every tool: sticky header with either an in-app back button
 * or, on a tool's top-level screen, a link to the 阿瓦隆工具集 home (a full page load,
 * since home is a separate app; hidden when the tool runs as its own installed app),
 * then the title and actions.
 */
export function AppShell({
  title,
  onBack,
  actions,
  header,
  children,
  homeHref = '/',
  helpHref,
}: {
  title: ReactNode
  /** In-app back navigation; omitted on a tool's top-level screen, which links home instead. */
  onBack?: () => void
  actions?: ReactNode
  /** Extra sticky content under the title bar. */
  header?: ReactNode
  children: ReactNode
  /** Where the home link points; `null` hides it (for the home app itself). */
  homeHref?: string | null
  /**
   * The docs page for this screen, shown as a ? at the right of the title bar. Always opens
   * in a new tab, so a game in progress stays put and an installed app hands the docs
   * (outside its scope) to the browser.
   */
  helpHref?: string
}) {
  const [reachable] = useState(canLinkHome)
  const showHome = !onBack && homeHref !== null && reachable
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="sticky top-0 z-30 bg-base/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex min-h-14 items-center gap-1 px-2">
          {showHome && (
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
            !showHome && <span className="w-2" />
          )}
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
          {actions}
          {helpHref && (
            <a
              href={helpHref}
              target="_blank"
              rel="noopener"
              aria-label="使用說明"
              title="使用說明"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-subtext1 hover:bg-surface0"
            >
              <IconHelpCircle size={22} aria-hidden />
            </a>
          )}
        </div>
        {header}
      </header>
      <main className="flex flex-1 flex-col px-4 pb-4">{children}</main>
    </div>
  )
}
