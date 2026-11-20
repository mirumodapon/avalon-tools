import type { Vote } from '@avalon/rules'
import { shuffle } from './shuffle.ts'

/** The two buttons in a random order, so where someone taps gives nothing away. */
export function voteOrder(randomInt?: (max: number) => number): [Vote, Vote] {
  return shuffle(['approve', 'reject'] as Vote[], randomInt) as [Vote, Vote]
}

/**
 * A team vote by passing the phone: each player in turn holds the card, taps 同意 or 反對,
 * and hands it on. `votes` are in the order cast; they are revealed together at the end.
 */
export type VoteFlow =
  | { step: 'idle' }
  | { step: 'handoff'; total: number; index: number; votes: Vote[] }
  | { step: 'choose'; total: number; index: number; votes: Vote[]; order: [Vote, Vote] }
  | { step: 'collected'; total: number; votes: Vote[] }

export type VoteAction =
  | { type: 'start'; total: number }
  | { type: 'reveal'; order: [Vote, Vote] }
  | { type: 'vote'; vote: Vote }
  /** Back key or app in background: the same player starts over. */
  | { type: 'hide' }
  | { type: 'reset' }

export const VOTE_IDLE: VoteFlow = { step: 'idle' }

export function voteReducer(flow: VoteFlow, action: VoteAction): VoteFlow {
  switch (action.type) {
    case 'start':
      return { step: 'handoff', total: action.total, index: 0, votes: [] }
    case 'reveal':
      return flow.step === 'handoff' ? { ...flow, step: 'choose', order: action.order } : flow
    case 'vote': {
      if (flow.step !== 'choose') return flow
      const votes = [...flow.votes, action.vote]
      const next = flow.index + 1
      return next < flow.total
        ? { step: 'handoff', total: flow.total, index: next, votes }
        : { step: 'collected', total: flow.total, votes }
    }
    case 'hide':
      return flow.step === 'choose'
        ? { step: 'handoff', total: flow.total, index: flow.index, votes: flow.votes }
        : flow
    case 'reset':
      return VOTE_IDLE
  }
}
