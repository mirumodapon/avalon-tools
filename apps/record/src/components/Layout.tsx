import { IconArrowLeft, IconSettings } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { navigate, type Route } from '../router.ts'
import { IconButton } from '@avalon/ui'

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
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="sticky top-0 z-30 bg-base/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex min-h-14 items-center gap-1 px-2">
          {back ? (
            <IconButton label="返回" onClick={() => navigate(back)}>
              <IconArrowLeft size={22} />
            </IconButton>
          ) : (
            <span className="w-2" />
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

export function SettingsLink() {
  return (
    <IconButton label="設定" onClick={() => navigate({ name: 'settings' })}>
      <IconSettings size={22} />
    </IconButton>
  )
}
