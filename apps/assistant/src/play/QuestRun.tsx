import {
  isQuestSize,
  type QuestCard,
  type QuestFlow,
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

const NONE: QuestCard[] = []

/**
 * The quest: the phone goes to each team member in seat order, then the result is revealed
 * (successes first). The cards played so far and whether the result is shown are saved by
 * the caller (`progress`/`onProgress`), so a reload resumes with the next member. Good
 * players get two 任務成功 buttons (see QuestSteps).
 */
export function QuestRun({
  game,
  team,
  progress,
  onProgress,
  onDone,
}: {
  game: Game
  team: readonly PlayerId[]
  progress: { played: QuestCard[]; revealed: boolean } | null
  onProgress: (played: QuestCard[], revealed: boolean) => void
  onDone: (failCount: number) => void
}) {
  const members = game.players.map((p) => p.id).filter((id) => team.includes(id))
  const [flow, dispatch] = useReducer(questReducer, QUEST_IDLE, (): QuestFlow => {
    const size = members.length
    if (!isQuestSize(size)) return QUEST_IDLE
    const played = progress?.played ?? []
    const fails = played.filter((c) => c === 'fail').length
    if (played.length < size) return { step: 'handoff', size, index: played.length, fails, played }
    return { step: progress?.revealed ? 'result' : 'collected', size, fails, played }
  })
  const played = flow.step === 'setup' ? NONE : flow.played
  const revealed = flow.step === 'result'
  const saved = progress ?? { played: [], revealed: false }
  useEffect(() => {
    if (played.length !== saved.played.length || revealed !== saved.revealed)
      onProgress(played, revealed)
  }, [played, revealed, saved.played.length, saved.revealed, onProgress])
  const hide = useCallback(() => dispatch({ type: 'hide' }), [])
  usePrivacyGuard(flow.step === 'handoff' || flow.step === 'choose', hide)
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
