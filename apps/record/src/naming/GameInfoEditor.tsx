import type { Game, GameAction } from '@avalon/record-core'
import { useState } from 'react'
import { TextField } from '@avalon/ui'
import { useDisplayName } from './useDisplayName.ts'

/**
 * Edits the game's custom name and note. Changes are committed on blur so that
 * typing does not create an action per keystroke.
 */
export function GameInfoEditor({
  game,
  dispatch,
}: {
  game: Game
  dispatch: (a: GameAction) => void
}) {
  const [name, setName] = useState(game.name.custom ?? '')
  const [note, setNote] = useState(game.note)
  const autoName = useDisplayName({ ...game, name: { ...game.name, custom: null } })

  return (
    <div className="space-y-3">
      <div
        onBlur={() => {
          if ((game.name.custom ?? '') !== name.trim()) dispatch({ type: 'rename', custom: name })
        }}
      >
        <TextField
          label="遊戲名稱"
          value={name}
          onChange={setName}
          placeholder={autoName}
          maxLength={60}
          hint={
            name.trim() ? '已自訂名稱，修改命名規則不會影響' : `留空時自動命名為「${autoName}」`
          }
        />
      </div>
      <div
        onBlur={() => {
          if (game.note !== note) dispatch({ type: 'setNote', note })
        }}
      >
        <TextField
          label="備註"
          value={note}
          onChange={setNote}
          multiline
          maxLength={2000}
          placeholder="地點、特殊規則、精彩時刻…"
        />
      </div>
    </div>
  )
}
