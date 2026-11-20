import { describe, expect, it } from 'vitest'
import { VOTE_IDLE, voteOrder, voteReducer, type VoteAction, type VoteFlow } from './vote.ts'

const run = (actions: VoteAction[], from: VoteFlow = VOTE_IDLE) => actions.reduce(voteReducer, from)
const ORDER = ['approve', 'reject'] as const

describe('voteReducer', () => {
  it('collects every vote in turn', () => {
    const flow = run([
      { type: 'start', total: 3 },
      { type: 'reveal', order: [...ORDER] },
      { type: 'vote', vote: 'approve' },
      { type: 'reveal', order: [...ORDER] },
      { type: 'vote', vote: 'reject' },
      { type: 'reveal', order: [...ORDER] },
      { type: 'vote', vote: 'approve' },
    ])
    expect(flow).toEqual({ step: 'collected', total: 3, votes: ['approve', 'reject', 'approve'] })
  })

  it('hands the phone back to the same voter when hidden', () => {
    const choosing = run([
      { type: 'start', total: 3 },
      { type: 'reveal', order: [...ORDER] },
      { type: 'vote', vote: 'approve' },
      { type: 'reveal', order: [...ORDER] },
    ])
    expect(voteReducer(choosing, { type: 'hide' })).toEqual({
      step: 'handoff',
      total: 3,
      index: 1,
      votes: ['approve'],
    })
  })

  it('ignores a vote when no one is choosing', () => {
    const handoff = run([{ type: 'start', total: 2 }])
    expect(voteReducer(handoff, { type: 'vote', vote: 'reject' })).toBe(handoff)
  })

  it('resets', () => {
    expect(run([{ type: 'start', total: 2 }, { type: 'reset' }])).toEqual(VOTE_IDLE)
  })
})

describe('voteOrder', () => {
  it('puts the buttons in a random order', () => {
    expect(voteOrder(() => 0)).toHaveLength(2)
    expect(new Set(voteOrder(() => 0))).toEqual(new Set(['approve', 'reject']))
  })
})
