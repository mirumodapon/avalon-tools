import {
  ladyTargetOptions,
  type Game,
  type LadyDeclaration,
  type PlayerId,
} from '@avalon/record-core'
import { cx, Segmented } from '@avalon/ui'
import { SeatNo } from '../play/ProposalForm.tsx'

const SHORT_REASON: Record<string, string> = {
  不能查驗自己: '持有者',
  曾持有過湖中女神: '持有過',
}

export const DECLARATION_OPTIONS: { value: LadyDeclaration; label: string }[] = [
  { value: 'good', label: '好人' },
  { value: 'evil', label: '壞人' },
  { value: 'none', label: '未宣告' },
]

/** Target grid (with disabled reasons) and declaration for one Lady use. */
export function LadyFields({
  game,
  index,
  holderId,
  targetId,
  declared,
  onTarget,
  onDeclared,
}: {
  game: Game
  /** Position of this use in `game.lady.uses` (or the next index for a new use). */
  index: number
  holderId: PlayerId
  targetId: PlayerId | null
  declared: LadyDeclaration
  onTarget: (id: PlayerId) => void
  onDeclared: (d: LadyDeclaration) => void
}) {
  const options = ladyTargetOptions(game, index, holderId)
  return (
    <div className="space-y-2.5">
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-subtext0">查驗對象</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {options.map((o, i) => {
            const p = game.players[i]!
            const selected = targetId === o.playerId
            return (
              <button
                key={o.playerId}
                type="button"
                aria-pressed={selected}
                disabled={o.disabledReason !== null}
                title={o.disabledReason ?? undefined}
                onClick={() => onTarget(o.playerId)}
                className={cx(
                  'flex min-h-12 items-center gap-2 rounded-xl border-2 px-2.5 text-left disabled:opacity-45',
                  selected ? 'border-lady bg-lady/15' : 'border-transparent bg-surface0',
                )}
              >
                <SeatNo n={i + 1} />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                {o.disabledReason && (
                  <span className="shrink-0 text-[11px] text-subtext0">
                    <span aria-hidden>{SHORT_REASON[o.disabledReason] ?? ''}</span>
                    <span className="sr-only">{o.disabledReason}</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </fieldset>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-subtext0">宣告結果（可能說謊）</p>
        <Segmented
          label="宣告結果"
          value={declared}
          options={DECLARATION_OPTIONS}
          onChange={onDeclared}
        />
      </div>
    </div>
  )
}
