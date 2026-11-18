import { ladyTargetOptions, type Game, type LadyDeclaration, type PlayerId } from '@avalon/core'
import { cx, Segmented } from '../components/ui.tsx'
import { SeatNo } from '../play/ProposalForm.tsx'

export const DECLARATION_OPTIONS: { value: LadyDeclaration; label: string }[] = [
  { value: 'good', label: '好人' },
  { value: 'evil', label: '壞人' },
  { value: 'none', label: '未宣告' },
]

/** Target grid (with disabled reasons), declaration and note for one Lady use. */
export function LadyFields({
  game,
  index,
  holderId,
  targetId,
  declared,
  note,
  onTarget,
  onDeclared,
  onNote,
}: {
  game: Game
  /** Position of this use in `game.lady.uses` (or the next index for a new use). */
  index: number
  holderId: PlayerId
  targetId: PlayerId | null
  declared: LadyDeclaration
  note: string
  onTarget: (id: PlayerId) => void
  onDeclared: (d: LadyDeclaration) => void
  onNote: (note: string) => void
}) {
  const options = ladyTargetOptions(game, index, holderId)
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-subtext0">查驗對象</legend>
        <div className="grid grid-cols-2 gap-2">
          {options.map((o, i) => {
            const p = game.players[i]!
            const selected = targetId === o.playerId
            return (
              <button
                key={o.playerId}
                type="button"
                aria-pressed={selected}
                disabled={o.disabledReason !== null}
                onClick={() => onTarget(o.playerId)}
                className={cx(
                  'flex min-h-14 flex-col justify-center rounded-xl border-2 px-3 text-left disabled:opacity-45',
                  selected ? 'border-lady bg-lady/15' : 'border-transparent bg-surface0',
                )}
              >
                <span className="flex items-center gap-2">
                  <SeatNo n={i + 1} />
                  <span className="truncate">{p.name}</span>
                </span>
                {o.disabledReason && (
                  <span className="mt-0.5 text-xs text-subtext0">{o.disabledReason}</span>
                )}
              </button>
            )
          })}
        </div>
      </fieldset>
      <div>
        <p className="mb-2 text-sm font-semibold text-subtext0">持有者宣告的結果（可能說謊）</p>
        <Segmented
          label="宣告結果"
          value={declared}
          options={DECLARATION_OPTIONS}
          onChange={onDeclared}
        />
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-subtext0">備註（可選）</span>
        <input
          className="min-h-11 w-full rounded-xl border border-overlay0 bg-base px-3 focus:border-accent focus:outline-none"
          value={note}
          maxLength={200}
          onChange={(e) => onNote(e.target.value)}
        />
      </label>
    </div>
  )
}
