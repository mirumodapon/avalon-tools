import { describe, expect, it } from 'vitest'
import { createGame, defaultPlayerNames, gameReducer, makePlayers } from './game.ts'
import { cellAnomaly, historyRows } from './history.ts'
import { votesFromApprovals } from './votes.ts'

const ids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']

describe('historyRows', () => {
  it('lists every proposal with derived info', () => {
    let g = createGame({ id: 'g', now: 'n', players: makePlayers(defaultPlayerNames(7)) })
    g = gameReducer(g, {
      type: 'propose',
      team: ['p1', 'p2'],
      votes: votesFromApprovals(ids, ['p1', 'p3']),
      inputMode: 'approvals',
    })
    g = gameReducer(g, {
      type: 'propose',
      team: ['p2', 'p3'],
      votes: votesFromApprovals(ids, ['p1', 'p2', 'p3', 'p4']),
      inputMode: 'anomalies',
    })
    g = gameReducer(g, { type: 'recordQuest', failCount: 1 })
    const rows = historyRows(g)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      questIndex: 0,
      attempt: 1,
      approvals: 2,
      approved: false,
      anomalies: { outsideApprove: ['p3'], insideReject: ['p2'] },
      quest: null,
    })
    expect(rows[1]).toMatchObject({
      attempt: 2,
      approved: true,
      quest: { failCount: 1, outcome: 'fail', failsRequired: 1 },
    })
    expect(cellAnomaly(rows[0]!.proposal, 'p3')).toBe('outside-approve')
    expect(cellAnomaly(rows[0]!.proposal, 'p2')).toBe('inside-reject')
    expect(cellAnomaly(rows[0]!.proposal, 'p1')).toBeNull()
  })
})
