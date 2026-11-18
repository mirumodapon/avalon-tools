import type { Game, GameAction } from '@avalon/record-core'
import { IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { Sheet } from '@avalon/ui'
import { Button, SectionTitle } from '@avalon/ui'
import { useGames } from '../games/store.ts'
import { GameInfoEditor } from '../naming/GameInfoEditor.tsx'
import { useDisplayName } from '../naming/useDisplayName.ts'
import { RolesPanel } from '../roles/RolesPanel.tsx'
import { navigate } from '../router.ts'

/** Per-game settings: title, note, roles (hidden by default) and deletion. */
export function GameSettingsSheet({
  game,
  open,
  onClose,
  dispatch,
}: {
  game: Game
  open: boolean
  onClose: () => void
  dispatch: (action: GameAction) => void
}) {
  const remove = useGames((s) => s.remove)
  const name = useDisplayName(game)
  const [confirming, setConfirming] = useState(false)

  function close() {
    setConfirming(false)
    onClose()
  }

  async function deleteGame() {
    close()
    navigate({ name: 'home' }, { replace: true })
    await remove(game.id)
  }

  return (
    <Sheet title="遊戲設定" open={open} onClose={close}>
      <div className="space-y-6">
        <section>
          <SectionTitle>標題與備註</SectionTitle>
          <GameInfoEditor game={game} dispatch={dispatch} />
        </section>
        <section>
          <SectionTitle>角色</SectionTitle>
          <RolesPanel game={game} dispatch={dispatch} />
        </section>
        <section aria-label="刪除遊戲" className="border-t border-surface0 pt-4">
          {confirming ? (
            <div role="alert" className="space-y-3 rounded-xl border border-fail p-3">
              <p className="text-sm">「{name}」將被永久刪除，無法復原。</p>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setConfirming(false)}>
                  取消
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => void deleteGame()}>
                  <IconTrash size={20} aria-hidden />
                  確定刪除
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full text-fail-fg!"
              onClick={() => setConfirming(true)}
            >
              <IconTrash size={20} aria-hidden />
              刪除這場遊戲
            </Button>
          )}
        </section>
      </div>
    </Sheet>
  )
}
