import { AppShell, EmptyState } from '@avalon/ui'
import { IconToolsOff } from '@tabler/icons-react'

export function NotFoundPage() {
  return (
    <AppShell title="找不到頁面" homeHref={null}>
      <EmptyState icon={<IconToolsOff size={48} />}>
        <p>找不到這個頁面</p>
        <a
          href="/"
          className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-accent px-4 font-semibold text-on-accent"
        >
          回到阿瓦隆工具集
        </a>
      </EmptyState>
    </AppShell>
  )
}
