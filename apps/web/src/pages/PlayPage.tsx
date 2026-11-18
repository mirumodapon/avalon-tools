import { deriveState } from '@avalon/core'
import { Page } from '../components/Layout.tsx'
import { useGame } from '../games/store.ts'
import { NotFoundPage } from './NotFoundPage.tsx'

export function PlayPage({ id }: { id: string }) {
  const game = useGame(id)
  if (!game) return <NotFoundPage message="找不到這場遊戲" />
  const s = deriveState(game)
  return (
    <Page title={game.name.custom ?? '進行中'} back={{ name: 'home' }}>
      <p className="pt-4 text-subtext0">
        第 {s.questIndex + 1} 個任務・第 {s.attempt} 次派票
      </p>
    </Page>
  )
}
