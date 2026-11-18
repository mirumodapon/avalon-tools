import { describe, expect, it } from 'vitest'
import type { InputMode, Votes } from './types.ts'
import {
  anomaliesFromVotes,
  approversFromVotes,
  convertFlags,
  deviationsFromVotes,
  flagsFromVotes,
  votesFromAnomalies,
  votesFromApprovals,
  votesFromDeviations,
  votesFromFlags,
} from './votes.ts'

const ids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']
const team = ['p1', 'p3', 'p5']

/** Deterministic pseudo-random generator for property-style tests. */
function* allVoteCombos(n: number): Generator<Votes> {
  for (let mask = 0; mask < 1 << n; mask++) {
    yield Object.fromEntries(
      ids.slice(0, n).map((id, i) => [id, mask & (1 << i) ? 'approve' : 'reject']),
    )
  }
}

describe('派票 (approvals)', () => {
  it('marks only approvers as approve', () => {
    expect(votesFromApprovals(['p1', 'p2', 'p3'], ['p2'])).toEqual({
      p1: 'reject',
      p2: 'approve',
      p3: 'reject',
    })
  })
  it('lists approvers in seat order', () => {
    expect(
      approversFromVotes(['p1', 'p2', 'p3'], { p3: 'approve', p1: 'approve', p2: 'reject' }),
    ).toEqual(['p1', 'p3'])
  })
})

describe('派跳 (anomalies)', () => {
  it('defaults to team approve, others reject', () => {
    const votes = votesFromDeviations(ids, team, [])
    expect(approversFromVotes(ids, votes)).toEqual(team)
  })

  it('applies 場外白 and 場內黑', () => {
    const votes = votesFromAnomalies(ids, team, { outsideApprove: ['p2'], insideReject: ['p5'] })
    expect(votes.p2).toBe('approve')
    expect(votes.p5).toBe('reject')
    expect(votes.p1).toBe('approve')
    expect(votes.p4).toBe('reject')
  })

  it('classifies anomalies from full votes', () => {
    const votes: Votes = {
      p1: 'approve',
      p2: 'approve',
      p3: 'reject',
      p4: 'reject',
      p5: 'approve',
      p6: 'reject',
      p7: 'approve',
    }
    expect(anomaliesFromVotes(ids, team, votes)).toEqual({
      outsideApprove: ['p2', 'p7'],
      insideReject: ['p3'],
    })
    expect(deviationsFromVotes(ids, team, votes)).toEqual(['p2', 'p3', 'p7'])
  })
})

describe('round-trip', () => {
  it('votes → anomalies → votes is identity for every combination', () => {
    for (const votes of allVoteCombos(7)) {
      expect(votesFromAnomalies(ids, team, anomaliesFromVotes(ids, team, votes))).toEqual(votes)
      expect(votesFromDeviations(ids, team, deviationsFromVotes(ids, team, votes))).toEqual(votes)
      expect(votesFromApprovals(ids, approversFromVotes(ids, votes))).toEqual(votes)
    }
  })

  it('anomalies → votes → anomalies is identity', () => {
    const anomalies = { outsideApprove: ['p4', 'p6'], insideReject: ['p1'] }
    expect(anomaliesFromVotes(ids, team, votesFromAnomalies(ids, team, anomalies))).toEqual(
      anomalies,
    )
  })

  it('approvals → votes → approvals is identity', () => {
    const approvers = ['p2', 'p3', 'p7']
    expect(approversFromVotes(ids, votesFromApprovals(ids, approvers))).toEqual(approvers)
  })

  it('switching input modes preserves the votes', () => {
    const modes: InputMode[] = ['approvals', 'anomalies']
    for (const votes of allVoteCombos(7)) {
      for (const from of modes) {
        for (const to of modes) {
          const flags = flagsFromVotes(from, ids, team, votes)
          const converted = convertFlags(from, to, ids, team, flags)
          expect(votesFromFlags(to, ids, team, converted)).toEqual(votes)
          // and back again
          expect(convertFlags(to, from, ids, team, converted)).toEqual(flags)
        }
      }
    }
  })

  it('an empty team in anomaly mode means approvals equal deviations', () => {
    expect(convertFlags('approvals', 'anomalies', ids, [], ['p2'])).toEqual(['p2'])
  })
})
