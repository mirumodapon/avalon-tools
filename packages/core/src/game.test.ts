import { describe, expect, it } from 'vitest'
import {
  canUndo,
  createGame,
  deriveState,
  gameReducer,
  GameRuleError,
  makePlayers,
  defaultPlayerNames,
  undoLast,
  type GameAction,
} from './game.ts'
import type { Game, PlayerId } from './types.ts'
import { uniformVotes, votesFromApprovals } from './votes.ts'

const NOW = '2026-11-18T12:00:00.000Z'

function newGame(n = 5, firstLeader = 'p1'): Game {
  return createGame({
    id: 'g1',
    now: NOW,
    players: makePlayers(defaultPlayerNames(n)),
    firstLeaderId: firstLeader,
  })
}

function ids(g: Game): PlayerId[] {
  return g.players.map((p) => p.id)
}

function run(g: Game, ...actions: GameAction[]): Game {
  return actions.reduce((acc, a) => gameReducer(acc, a, NOW), g)
}

/** A proposal with `team` that everyone approves or rejects. */
function propose(g: Game, team: PlayerId[], pass: boolean): GameAction {
  return {
    type: 'propose',
    team,
    votes: uniformVotes(ids(g), pass ? 'approve' : 'reject'),
    inputMode: 'approvals',
  }
}

/** Plays a whole quest: one passing proposal and a result. */
function quest(g: Game, fails: number): Game {
  const s = deriveState(g)
  const team = ids(g).slice(0, s.teamSize)
  return run(g, propose(g, team, true), { type: 'recordQuest', failCount: fails })
}

describe('createGame', () => {
  it('rejects bad player counts', () => {
    expect(() => newGame(4)).toThrow(GameRuleError)
    expect(() => newGame(11)).toThrow(GameRuleError)
  })
  it('defaults names and first leader', () => {
    const g = createGame({ id: 'x', now: NOW, players: makePlayers(['阿明', '', 'C', 'D', 'E']) })
    expect(g.players[1]!.name).toBe('2號')
    expect(g.firstLeaderId).toBe('p1')
    expect(g.name.custom).toBeNull()
  })
  it('trims custom name and treats blank as none', () => {
    const p = makePlayers(defaultPlayerNames(5))
    expect(
      createGame({ id: 'x', now: NOW, players: p, name: { custom: '  ' } }).name.custom,
    ).toBeNull()
    expect(
      createGame({ id: 'x', now: NOW, players: p, name: { custom: ' 週五團 ' } }).name.custom,
    ).toBe('週五團')
  })
})

describe('deriveState', () => {
  it('starts at quest 1 attempt 1 with the first leader', () => {
    const s = deriveState(newGame(5, 'p3'))
    expect(s).toMatchObject({
      phase: 'proposal',
      questIndex: 0,
      attempt: 1,
      leaderId: 'p3',
      teamSize: 2,
      failsRequired: 1,
      forced: false,
      winner: null,
    })
  })

  it('rotates the leader clockwise on every proposal, across quests', () => {
    let g = newGame(5, 'p4')
    g = run(g, propose(g, ['p1', 'p2'], false))
    expect(deriveState(g).leaderId).toBe('p5')
    g = run(g, propose(g, ['p1', 'p2'], false))
    expect(deriveState(g).leaderId).toBe('p1')
    g = run(g, propose(g, ['p1', 'p2'], true), { type: 'recordQuest', failCount: 0 })
    expect(deriveState(g)).toMatchObject({ questIndex: 1, attempt: 1, leaderId: 'p2' })
  })

  it('follows a leader override for subsequent proposals', () => {
    let g = newGame(5)
    g = run(g, { ...propose(g, ['p1', 'p2'], false), leaderId: 'p3' } as GameAction)
    expect(deriveState(g).leaderId).toBe('p4')
  })

  it('requires strictly more than half to approve', () => {
    let g = newGame(6)
    const votes = votesFromApprovals(ids(g), ['p1', 'p2', 'p3'])
    g = run(g, { type: 'propose', team: ['p1', 'p2'], votes, inputMode: 'approvals' })
    expect(deriveState(g)).toMatchObject({ phase: 'proposal', attempt: 2 })
    const votes4 = votesFromApprovals(ids(g), ['p1', 'p2', 'p3', 'p4'])
    g = run(g, { type: 'propose', team: ['p1', 'p2'], votes: votes4, inputMode: 'approvals' })
    expect(deriveState(g)).toMatchObject({ phase: 'quest', attempt: 2 })
  })

  it('marks the 5th proposal as forced and sends it on the quest even if all reject', () => {
    let g = newGame(5)
    for (let i = 0; i < 4; i++) g = run(g, propose(g, ['p1', 'p2'], false))
    expect(deriveState(g)).toMatchObject({ phase: 'proposal', attempt: 5, forced: true })
    g = run(g, propose(g, ['p1', 'p2'], false))
    const round = g.rounds[0]!
    expect(round.proposals).toHaveLength(5)
    expect(round.proposals[4]!.forced).toBe(true)
    expect(round.proposals[4]!.id).toBe('q1-p5')
    expect(deriveState(g)).toMatchObject({ phase: 'quest', forced: true })
  })

  it('applies the two-fail rule on quest 4 with 7 players', () => {
    let g = newGame(7)
    g = quest(g, 0)
    g = quest(g, 1)
    g = quest(g, 0)
    expect(deriveState(g)).toMatchObject({ questIndex: 3, teamSize: 4, failsRequired: 2 })
    g = quest(g, 1)
    expect(deriveState(g).outcomes[3]).toBe('success')
    expect(deriveState(g).winner).toBeNull()
  })

  it('ends with evil winning after 3 failed quests', () => {
    let g = newGame(5)
    g = quest(g, 1)
    g = quest(g, 0)
    g = quest(g, 2)
    g = quest(g, 1)
    expect(deriveState(g)).toMatchObject({
      phase: 'finished',
      winner: 'evil',
      winReason: 'quests-failed',
      successes: 1,
      fails: 3,
    })
  })

  it('goes to assassination after 3 successes', () => {
    let g = newGame(5)
    g = quest(g, 0)
    g = quest(g, 0)
    g = quest(g, 0)
    expect(deriveState(g)).toMatchObject({ phase: 'assassination', winner: null, successes: 3 })
    expect(() => run(g, propose(g, ['p1', 'p2', 'p3'], true))).toThrow(GameRuleError)

    const missed = run(g, { type: 'assassinate', targetId: 'p2', manualHit: false })
    expect(deriveState(missed)).toMatchObject({
      phase: 'finished',
      winner: 'good',
      winReason: 'assassination-missed',
    })
    const hit = run(g, { type: 'assassinate', targetId: 'p2', manualHit: true })
    expect(deriveState(hit)).toMatchObject({ winner: 'evil', winReason: 'assassination-hit' })
  })
})

describe('validation', () => {
  it('rejects the wrong team size', () => {
    const g = newGame(5)
    expect(() => run(g, propose(g, ['p1'], true))).toThrow(/需要選 2 位/)
    expect(() => run(g, propose(g, ['p1', 'p1'], true))).toThrow(/重複/)
    expect(() => run(g, propose(g, ['p1', 'p9'], true))).toThrow(/不在/)
  })
  it('rejects missing votes', () => {
    const g = newGame(5)
    expect(() =>
      run(g, {
        type: 'propose',
        team: ['p1', 'p2'],
        votes: { p1: 'approve' },
        inputMode: 'approvals',
      }),
    ).toThrow(/缺少/)
  })
  it('rejects a quest result outside 0..team size', () => {
    let g = newGame(5)
    g = run(g, propose(g, ['p1', 'p2'], true))
    expect(() => run(g, { type: 'recordQuest', failCount: 3 })).toThrow(GameRuleError)
    expect(() => run(g, { type: 'recordQuest', failCount: -1 })).toThrow(GameRuleError)
  })
  it('rejects a quest result before a proposal passes', () => {
    const g = newGame(5)
    expect(() => run(g, { type: 'recordQuest', failCount: 0 })).toThrow(/不是任務/)
  })
  it('stores team in seat order and normalizes votes', () => {
    let g = newGame(5)
    g = run(g, propose(g, ['p4', 'p2'], true))
    expect(g.rounds[0]!.proposals[0]!.team).toEqual(['p2', 'p4'])
  })
})

describe('undo', () => {
  it('steps back assassination → result → proposals', () => {
    let g = newGame(5)
    g = quest(g, 0)
    g = quest(g, 0)
    g = run(g, propose(g, ['p1', 'p2'], false))
    g = quest(g, 0)
    g = run(g, { type: 'assassinate', targetId: 'p1', manualHit: false })
    expect(deriveState(g).phase).toBe('finished')

    g = undoLast(g)
    expect(deriveState(g).phase).toBe('assassination')
    g = undoLast(g)
    expect(deriveState(g)).toMatchObject({ phase: 'quest', questIndex: 2, attempt: 2 })
    g = undoLast(g)
    expect(deriveState(g)).toMatchObject({ phase: 'proposal', questIndex: 2, attempt: 2 })
    g = undoLast(g)
    expect(deriveState(g)).toMatchObject({ phase: 'proposal', questIndex: 2, attempt: 1 })
    expect(g.rounds).toHaveLength(2)
  })

  it('is a no-op on a fresh game', () => {
    const g = newGame(5)
    expect(canUndo(g)).toBe(false)
    expect(undoLast(g)).toBe(g)
  })

  it('recomputes the leader after undo', () => {
    let g = newGame(5, 'p2')
    g = run(g, propose(g, ['p1', 'p2'], false), propose(g, ['p1', 'p2'], false))
    expect(deriveState(g).leaderId).toBe('p4')
    g = run(g, { type: 'undo' })
    expect(deriveState(g).leaderId).toBe('p3')
  })
})

describe('notes and meta', () => {
  it('sets proposal and quest notes', () => {
    let g = quest(newGame(5), 1)
    g = run(
      g,
      { type: 'setProposalNote', questIndex: 0, proposalIndex: 0, note: '帶風向' },
      { type: 'setQuestNote', questIndex: 0, note: '一張失敗' },
      { type: 'setNote', note: '在咖啡廳' },
      { type: 'rename', custom: '  ' },
    )
    expect(g.rounds[0]!.proposals[0]!.note).toBe('帶風向')
    expect(g.rounds[0]!.result!.note).toBe('一張失敗')
    expect(g.note).toBe('在咖啡廳')
    expect(g.name.custom).toBeNull()
  })

  it('marks saved with a timestamp', () => {
    const g = gameReducer(newGame(5), { type: 'markSaved' }, '2026-11-18T13:00:00.000Z')
    expect(g.savedAt).toBe('2026-11-18T13:00:00.000Z')
  })

  it('does not mutate the input', () => {
    const g = newGame(5)
    const snapshot = structuredClone(g)
    run(g, propose(g, ['p1', 'p2'], true))
    expect(g).toEqual(snapshot)
  })
})
