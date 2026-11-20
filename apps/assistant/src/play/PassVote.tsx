import {
  usePrivacyGuard,
  VOTE_IDLE,
  VoteSteps,
  voteReducer,
  type VoteFlow,
} from '@avalon/pass-play'
import type { Vote } from '@avalon/rules'
import type { Game, PlayerId, Votes } from '@avalon/record-core'
import { useCallback, useEffect, useReducer } from 'react'
import { seatLabel } from '../seat.ts'
import { votingOrder } from './votingOrder.ts'

/**
 * 傳手機投票: from the leader round the table, each votes in private; holding the card at the
 * end reveals them all. `cast` (the votes so far, saved by the caller through `onCast`) lets
 * a reload resume with the next voter.
 */
export function PassVote({
  game,
  leaderId,
  cast,
  onCast,
  onDone,
}: {
  game: Game
  leaderId: PlayerId
  cast: Vote[]
  onCast: (cast: Vote[]) => void
  onDone: (votes: Votes) => void
}) {
  const order = votingOrder(game, leaderId)
  const [flow, dispatch] = useReducer(voteReducer, VOTE_IDLE, (): VoteFlow =>
    cast.length >= order.length
      ? { step: 'collected', total: order.length, votes: cast }
      : { step: 'handoff', total: order.length, index: cast.length, votes: cast },
  )
  const votes = flow.step === 'idle' ? cast : flow.votes
  useEffect(() => {
    if (votes.length !== cast.length) onCast(votes)
  }, [votes, cast.length, onCast])
  const hide = useCallback(() => dispatch({ type: 'hide' }), [])
  usePrivacyGuard(flow.step === 'handoff' || flow.step === 'choose', hide)

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
