import { IconSettings } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { navigate, type Route } from '../router.ts'
import { AppShell, IconButton } from '@avalon/ui'

/**
 * A record screen on the shared AppShell. Inner screens get a back button (to `back`, or
 * `onBack`); only the top-level list links to the 阿瓦隆工具集 home.
 */
export function Page({
  title,
  back,
  onBack,
  actions,
  children,
  header,
  helpHref,
}: {
  title: ReactNode
  back?: Route
  /** Custom back action, for screens whose way back is more than a route change. */
  onBack?: () => void
  actions?: ReactNode
  children: ReactNode
  /** Extra sticky content under the title bar (e.g. game progress). */
  header?: ReactNode
  /** The docs page for this screen (see AppShell). */
  helpHref?: string
}) {
  return (
    <AppShell
      title={title}
      onBack={onBack ?? (back ? () => navigate(back) : undefined)}
      actions={actions}
      header={header}
      helpHref={helpHref}
    >
      {children}
    </AppShell>
  )
}

export function SettingsLink() {
  return (
    <IconButton label="設定" onClick={() => navigate({ name: 'settings' })}>
      <IconSettings size={22} />
    </IconButton>
  )
}
