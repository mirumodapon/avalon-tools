import { IconMoodConfuzed } from '@tabler/icons-react'
import { Page } from '../components/Layout.tsx'
import { Button, EmptyState } from '../components/ui.tsx'
import { navigate } from '../router.ts'

export function NotFoundPage({ message = '找不到這個頁面' }: { message?: string }) {
  return (
    <Page title="找不到" back={{ name: 'home' }}>
      <EmptyState icon={<IconMoodConfuzed size={48} />}>
        <p>{message}</p>
        <Button onClick={() => navigate({ name: 'home' })}>回到首頁</Button>
      </EmptyState>
    </Page>
  )
}
