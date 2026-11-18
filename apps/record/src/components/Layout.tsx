import { IconSettings } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { navigate, type Route } from '../router.ts'
import { AppShell, IconButton } from '@avalon/ui'

/** A record screen: the shared AppShell (with the home link) plus record's back navigation. */
export function Page({
  title,
  back,
  actions,
  children,
  header,
}: {
  title: ReactNode
  back?: Route
  actions?: ReactNode
  children: ReactNode
  /** Extra sticky content under the title bar (e.g. game progress). */
  header?: ReactNode
}) {
  return (
    <AppShell
      title={title}
      onBack={back ? () => navigate(back) : undefined}
      actions={actions}
      header={header}
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
