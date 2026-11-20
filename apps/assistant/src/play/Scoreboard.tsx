import { deriveState, type Game } from '@avalon/record-core'
import { failsRequired, QUEST_COUNT, teamSize } from '@avalon/rules'
import { cx } from '@avalon/ui'

/** The five quests (size, result, two-fail marker) and where the current proposal stands. */
export function Scoreboard({ game }: { game: Game }) {
  const s = deriveState(game)
  const n = game.players.length
  return (
    <div className="space-y-2">
      <ol className="grid grid-cols-5 gap-2">
        {Array.from({ length: QUEST_COUNT }, (_, i) => {
          const size = teamSize(n, i)
          const twoFails = failsRequired(n, i) > 1
          const outcome = s.outcomes[i]
          return (
            <li
              key={i}
              aria-label={`第 ${i + 1} 次任務：${size} 人${twoFails ? '，需要 2 張失敗' : ''}`}
              className={cx(
                'flex aspect-square flex-col items-center justify-center rounded-full border-2 text-lg font-bold',
                outcome === 'success' && 'border-success bg-success/20 text-success-fg',
                outcome === 'fail' && 'border-fail bg-fail/20 text-fail-fg',
                outcome === null && i === s.questIndex && 'border-accent',
                outcome === null && i !== s.questIndex && 'border-surface1 text-subtext0',
              )}
            >
              {size}
              {twoFails && <span className="text-[10px] leading-none">2 敗</span>}
            </li>
          )
        })}
      </ol>
      {s.phase === 'proposal' && (
        <p className="flex items-center justify-center gap-2 text-subtext1">
          第 {s.questIndex + 1} 次任務・第 {s.attempt} 次組隊
          {s.forced && (
            <span className="rounded-full bg-forced/20 px-2 text-sm font-bold text-forced-fg">
              強制局
            </span>
          )}
        </p>
      )}
    </div>
  )
}
