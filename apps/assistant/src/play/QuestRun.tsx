import {
  isQuestSize,
  QUEST_IDLE,
  QuestCards,
  QuestSteps,
  questReducer,
  questResultText,
  resultText,
  usePrivacyGuard,
} from '@avalon/pass-play'
import { playerFaction, type Game, type PlayerId } from '@avalon/record-core'
import { BottomBar, Button, cx } from '@avalon/ui'
import { useCallback, useEffect, useReducer } from 'react'
import { seatLabel } from '../seat.ts'

/**
 * The quest: the phone goes to each team member in seat order, then the result is revealed
 * (successes first). The cards live only here, so a reload starts the quest over. Good
 * players get two 任務成功 buttons (see QuestSteps).
 */
export function QuestRun({
  game,
  team,
  onDone,
}: {
  game: Game
  team: readonly PlayerId[]
  onDone: (failCount: number) => void
}) {
  const [flow, dispatch] = useReducer(questReducer, QUEST_IDLE)
  const hide = useCallback(() => dispatch({ type: 'hide' }), [])
  usePrivacyGuard(flow.step === 'handoff' || flow.step === 'choose', hide)
  const members = game.players.map((p) => p.id).filter((id) => team.includes(id))

  useEffect(() => {
    if (flow.step === 'setup' && isQuestSize(members.length))
      dispatch({ type: 'start', size: members.length })
  }, [flow.step, members.length])

  if (flow.step === 'setup') return null
  if (flow.step === 'result') {
    return (
      <>
        <div className="flex flex-col items-center gap-6 py-6 text-center">
          <p className={cx('text-4xl font-bold', questResultText(flow.fails))}>
            {resultText(flow.fails)}
          </p>
          <QuestCards size={flow.size} fails={flow.fails} />
        </div>
        <BottomBar>
          <Button variant="primary" className="w-full" onClick={() => onDone(flow.fails)}>
            繼續
          </Button>
        </BottomBar>
      </>
    )
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
      <QuestSteps
        flow={flow}
        dispatch={dispatch}
        who={(i) => seatLabel(game, members[i]!)}
        // Good players can only succeed; their screen still looks like everyone else's.
        successOnly={(i) => playerFaction(game, members[i]!) === 'good'}
      />
    </div>
  )
}
