import { usePrivacyGuard, VOTE_IDLE, VoteSteps, voteReducer } from '@avalon/pass-play'
import type { Game, PlayerId, Votes } from '@avalon/record-core'
import { useCallback, useEffect, useReducer } from 'react'
import { seatLabel } from '../seat.ts'
import { votingOrder } from './votingOrder.ts'

/**
 * 傳手機投票: from the leader round the table, each votes in private; holding the card at the
 * end reveals them all. The votes live only here, so a reload starts the vote over.
 */
export function PassVote({
  game,
  leaderId,
  onDone,
}: {
  game: Game
  leaderId: PlayerId
  onDone: (votes: Votes) => void
}) {
  const order = votingOrder(game, leaderId)
  const [flow, dispatch] = useReducer(voteReducer, VOTE_IDLE)
  const hide = useCallback(() => dispatch({ type: 'hide' }), [])
  usePrivacyGuard(flow.step === 'handoff' || flow.step === 'choose', hide)

  useEffect(() => {
    if (flow.step === 'idle') dispatch({ type: 'start', total: order.length })
  }, [flow.step, order.length])

  if (flow.step === 'idle') return null
  const show = () => {
    if (flow.step !== 'collected') return
    onDone(Object.fromEntries(order.map((id, i) => [id, flow.votes[i]!])) as Votes)
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
      <VoteSteps
        flow={flow}
        dispatch={dispatch}
        who={(i) => seatLabel(game, order[i]!)}
        onShow={show}
      />
    </div>
  )
}
