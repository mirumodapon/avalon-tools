import { playerName, validateLadyUses, type Game, type GameAction } from '@avalon/core'
import { Sheet } from '../components/Sheet.tsx'
import { SectionTitle, Switch } from '../components/ui.tsx'
import { LadyFields } from './LadyFields.tsx'

/** Edit a recorded Lady use; later uses are re-validated and flagged. */
export function LadyEditSheet({
  game,
  index,
  onClose,
  dispatch,
}: {
  game: Game
  index: number | null
  onClose: () => void
  dispatch: (action: GameAction) => void
}) {
  const use = index !== null ? game.lady?.uses[index] : undefined
  const errors = validateLadyUses(game)
  return (
    <Sheet title="編輯湖中女神" open={use !== undefined} onClose={onClose}>
      {use && index !== null && (
        <div className="space-y-4">
          <div>
            <SectionTitle>持有者</SectionTitle>
            <select
              aria-label="持有者"
              className="min-h-11 w-full rounded-xl border border-overlay0 bg-base px-3"
              value={use.holderId}
              onChange={(e) =>
                dispatch({ type: 'editLady', index, patch: { holderId: e.target.value } })
              }
            >
              {game.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Switch
            label="這次跳過（湖中女神留在持有者手上）"
            checked={use.skipped}
            onChange={(skipped) => dispatch({ type: 'editLady', index, patch: { skipped } })}
          />
          {!use.skipped && (
            <LadyFields
              game={game}
              index={index}
              holderId={use.holderId}
              targetId={use.targetId}
              declared={use.declared}
              note={use.note}
              onTarget={(targetId) => dispatch({ type: 'editLady', index, patch: { targetId } })}
              onDeclared={(declared) => dispatch({ type: 'editLady', index, patch: { declared } })}
              onNote={(note) => dispatch({ type: 'editLady', index, patch: { note } })}
            />
          )}
          {errors.some((e) => e.length > 0) && (
            <ul
              role="alert"
              className="space-y-1 rounded-xl border border-fail p-3 text-sm text-fail-fg"
            >
              {errors.flatMap((list, i) =>
                list.map((e) => (
                  <li key={`${i}-${e}`}>
                    第 {i + 1} 次（{playerName(game, game.lady!.uses[i]!.holderId)}）：{e}
                  </li>
                )),
              )}
            </ul>
          )}
        </div>
      )}
    </Sheet>
  )
}
