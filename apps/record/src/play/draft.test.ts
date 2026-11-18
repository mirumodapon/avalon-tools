import { describe, expect, it } from 'vitest'
import {
  draftVotes,
  emptyDraft,
  initialInputMode,
  setAll,
  switchMode,
  toggleFlag,
  toggleTeam,
} from './draft.ts'

const ids = ['p1', 'p2', 'p3', 'p4', 'p5']

describe('proposal draft', () => {
  it('records approvers in 派票 mode', () => {
    let d = emptyDraft('approvals')
    d = toggleTeam(toggleTeam(d, 'p1'), 'p2')
    d = toggleFlag(toggleFlag(d, 'p1'), 'p3')
    expect(draftVotes(d, ids)).toEqual({
      p1: 'approve',
      p2: 'reject',
      p3: 'approve',
      p4: 'reject',
      p5: 'reject',
    })
  })

  it('records anomalies in 派跳 mode', () => {
    let d = emptyDraft('anomalies')
    d = toggleTeam(toggleTeam(d, 'p1'), 'p2')
    d = toggleFlag(d, 'p2') // 場內黑
    d = toggleFlag(d, 'p5') // 場外白
    expect(draftVotes(d, ids)).toEqual({
      p1: 'approve',
      p2: 'reject',
      p3: 'reject',
      p4: 'reject',
      p5: 'approve',
    })
  })

  it('keeps votes when switching modes back and forth', () => {
    let d = emptyDraft('anomalies')
    d = toggleTeam(toggleTeam(d, 'p1'), 'p2')
    d = toggleFlag(toggleFlag(d, 'p2'), 'p5')
    const votes = draftVotes(d, ids)
    const a = switchMode(d, 'approvals', ids)
    expect(a.flags.toSorted()).toEqual(['p1', 'p5'])
    expect(draftVotes(a, ids)).toEqual(votes)
    const b = switchMode(a, 'anomalies', ids)
    expect(b.flags.toSorted()).toEqual(['p2', 'p5'])
    expect(draftVotes(b, ids)).toEqual(votes)
  })

  it('takes the new mode defaults when nothing was entered yet', () => {
    let d = emptyDraft('approvals')
    d = toggleTeam(toggleTeam(d, 'p1'), 'p2')
    const a = switchMode(d, 'anomalies', ids)
    expect(a.flags).toEqual([])
    expect(draftVotes(a, ids).p1).toBe('approve')
  })

  it('resets a deviation when membership changes in 派跳 mode', () => {
    let d = emptyDraft('anomalies')
    d = toggleFlag(d, 'p3') // 場外白
    d = toggleTeam(d, 'p3')
    expect(d.flags).toEqual([])
    expect(draftVotes(d, ids).p3).toBe('approve')
  })

  it('sets all votes in either mode', () => {
    for (const mode of ['approvals', 'anomalies'] as const) {
      const d = toggleTeam(emptyDraft(mode), 'p1')
      expect(Object.values(draftVotes(setAll(d, 'approve', ids), ids))).toEqual(
        Array(5).fill('approve'),
      )
      expect(Object.values(draftVotes(setAll(d, 'reject', ids), ids))).toEqual(
        Array(5).fill('reject'),
      )
    }
  })
})

const proposal = (inputMode: 'approvals' | 'anomalies') => ({
  id: 'x',
  leaderId: 'p1',
  team: [],
  votes: {},
  inputMode,
  forced: false,
})

describe('initialInputMode', () => {
  it('follows the last proposal of the game', () => {
    const game = {
      rounds: [
        { proposals: [proposal('approvals')], result: { failCount: 0 } },
        { proposals: [proposal('approvals'), proposal('anomalies')], result: null },
      ],
    }
    expect(initialInputMode(game, 'approvals')).toBe('anomalies')
  })
  it('falls back to the remembered mode for a new game', () => {
    expect(initialInputMode({ rounds: [] }, 'anomalies')).toBe('anomalies')
  })
})
