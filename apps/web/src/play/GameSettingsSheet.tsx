import type { Game, GameAction } from '@avalon/core'
import { Sheet } from '../components/Sheet.tsx'
import { SectionTitle } from '../components/ui.tsx'
import { GameInfoEditor } from '../naming/GameInfoEditor.tsx'
import { RolesPanel } from '../roles/RolesPanel.tsx'

/** In-game settings: title, note and (hidden by default) roles. */
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
  return (
    <Sheet title="遊戲設定" open={open} onClose={onClose}>
      <div className="space-y-6">
        <section>
          <SectionTitle>標題與備註</SectionTitle>
          <GameInfoEditor game={game} dispatch={dispatch} />
        </section>
        <section>
          <SectionTitle>角色</SectionTitle>
          <RolesPanel game={game} dispatch={dispatch} />
        </section>
      </div>
    </Sheet>
  )
}
