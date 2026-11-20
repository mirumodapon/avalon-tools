import { docsHref } from '@avalon/registry'
import { AppShell, EmptyState } from '@avalon/ui'
import { IconFileUnknown } from '@tabler/icons-react'

const BUTTON =
  'mt-2 inline-flex min-h-11 items-center rounded-xl bg-accent px-4 font-semibold text-on-accent'

/**
 * Home's 404.html answers every unknown path on the site, the docs' included (GitHub
 * Pages has a single 404 page), so a broken docs link leads back to the docs.
 */
export function NotFoundPage({ pathname = window.location.pathname }: { pathname?: string }) {
  const docs = docsHref()
  const inDocs = pathname.startsWith(docs)
  return (
    <AppShell title="找不到頁面" homeHref={null}>
      <EmptyState icon={<IconFileUnknown size={48} />}>
        <p>{inDocs ? '找不到這個說明頁面' : '找不到這個頁面'}</p>
        <a href={inDocs ? docs : '/'} className={BUTTON}>
          {inDocs ? '回到使用說明' : '回到阿瓦隆工具集'}
        </a>
      </EmptyState>
    </AppShell>
  )
}
