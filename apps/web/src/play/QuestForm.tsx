import { playerName, questSucceeded, type Game, type GameState } from '@avalon/core'
import { IconCircleCheckFilled, IconCircleXFilled, IconSend } from '@tabler/icons-react'
import { useState } from 'react'
import { ForcedBadge, TeamMark } from '../components/marks.tsx'
import { BottomBar, Button, Card, cx, SectionTitle } from '../components/ui.tsx'

export function QuestForm({
  game,
  state,
  onSubmit,
}: {
  game: Game
  state: GameState
  onSubmit: (input: { failCount: number }) => void
}) {
  const [failCount, setFailCount] = useState<number | null>(null)
  const proposal = game.rounds[state.questIndex]?.proposals.at(-1)
  const success =
    failCount !== null && questSucceeded(game.players.length, state.questIndex, failCount)

  return (
    <div className="flex flex-1 flex-col">
      <Card className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-subtext0">出任務的隊伍</h2>
          {proposal?.forced && <ForcedBadge />}
        </div>
        <ul className="flex flex-wrap gap-2">
          {proposal?.team.map((id) => (
            <li key={id} className="flex items-center gap-1 rounded-full bg-surface0 px-3 py-1">
              <TeamMark size={14} />
              {playerName(game, id)}
            </li>
          ))}
        </ul>
      </Card>

      <SectionTitle>失敗票張數</SectionTitle>
      {state.failsRequired === 2 && (
        <p className="mb-2 text-sm font-semibold text-forced-fg">本局需要 2 張失敗才算任務失敗</p>
      )}
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="失敗票張數">
        {Array.from({ length: state.teamSize + 1 }, (_, n) => (
          <label
            key={n}
            className={cx(
              'flex min-h-16 cursor-pointer items-center justify-center rounded-xl border-2 text-2xl font-bold has-focus-visible:outline-2 has-focus-visible:outline-accent',
              failCount === n ? 'border-accent bg-accent/15' : 'border-transparent bg-surface0',
            )}
          >
            <input
              type="radio"
              name="failCount"
              className="sr-only"
              checked={failCount === n}
              onChange={() => setFailCount(n)}
            />
            {n}
          </label>
        ))}
      </div>

      <div className="flex-1" />
      <BottomBar>
        {failCount !== null && (
          <p
            aria-live="polite"
            className={cx(
              'mb-2 flex items-center justify-center gap-1 font-semibold',
              success ? 'text-success-fg' : 'text-fail-fg',
            )}
          >
            {success ? (
              <IconCircleCheckFilled size={20} aria-hidden />
            ) : (
              <IconCircleXFilled size={20} aria-hidden />
            )}
            任務{success ? '成功' : '失敗'}
          </p>
        )}
        <Button
          variant="primary"
          className="w-full"
          disabled={failCount === null}
          onClick={() => failCount !== null && onSubmit({ failCount })}
        >
          <IconSend size={20} aria-hidden />
          送出任務結果
        </Button>
      </BottomBar>
    </div>
  )
}
