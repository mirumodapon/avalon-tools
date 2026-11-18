import { deriveState } from '@avalon/core'
import { IconCards, IconPlus } from '@tabler/icons-react'
import { Page, SettingsLink } from '../components/Layout.tsx'
import { BottomBar, Button, Card, EmptyState } from '../components/ui.tsx'
import { useGames } from '../games/store.ts'
import { navigate } from '../router.ts'

export function HomePage() {
  const games = useGames((s) => s.games)
  return (
    <Page title="阿瓦隆紀錄" actions={<SettingsLink />}>
      <div className="flex-1 space-y-3 pt-2">
        {games.length === 0 && (
          <EmptyState icon={<IconCards size={48} />}>還沒有任何遊戲紀錄</EmptyState>
        )}
        {games.map((g) => {
          const s = deriveState(g)
          const name = g.name.custom ?? (g.name.auto || '未命名')
          return (
            <button
              key={g.id}
              type="button"
              aria-label={name}
              className="block w-full text-left"
              onClick={() => navigate({ name: 'play', id: g.id })}
            >
              <Card>
                <div className="font-semibold">{name}</div>
                <div className="text-sm text-subtext0">
                  {g.players.length} 人・
                  {s.phase === 'finished' ? '已結束' : `第 ${s.questIndex + 1} 局進行中`}
                </div>
              </Card>
            </button>
          )
        })}
      </div>
      <BottomBar>
        <Button variant="primary" className="w-full" onClick={() => navigate({ name: 'new' })}>
          <IconPlus size={20} aria-hidden />
          開新局
        </Button>
      </BottomBar>
    </Page>
  )
}
