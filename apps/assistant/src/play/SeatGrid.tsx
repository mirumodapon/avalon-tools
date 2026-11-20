import type { Game, PlayerId } from '@avalon/record-core'
import { cx } from '@avalon/ui'
import { seatLabel } from '../seat.ts'

/** Every seat as a toggle button, in seat order. `disabled` returns why a seat can't be picked. */
export function SeatGrid({
  game,
  selected,
  onToggle,
  disabled,
}: {
  game: Pick<Game, 'players'>
  selected: readonly PlayerId[]
  onToggle: (id: PlayerId) => void
  disabled?: (id: PlayerId) => string | null
}) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {game.players.map((p) => {
        const on = selected.includes(p.id)
        const reason = disabled?.(p.id) ?? null
        return (
          <li key={p.id}>
            <button
              type="button"
              aria-pressed={on}
              disabled={reason !== null}
              title={reason ?? undefined}
              onClick={() => onToggle(p.id)}
              className={cx(
                'flex h-14 w-full flex-col items-start justify-center rounded-xl border-2 px-3 text-left font-bold',
                on
                  ? 'border-accent bg-accent/15 text-text'
                  : 'border-surface1 bg-mantle text-subtext1',
                reason !== null && 'opacity-50',
              )}
            >
              {seatLabel(game, p.id)}
              {reason && <span className="text-xs font-normal">{reason}</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
