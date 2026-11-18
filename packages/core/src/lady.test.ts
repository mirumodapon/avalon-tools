import { describe, expect, it } from 'vitest'
import {
  createGame,
  defaultPlayerNames,
  deriveState,
  gameReducer,
  GameRuleError,
  makePlayers,
  undoLast,
  type GameAction,
} from './game.ts'
import {
  currentLadyHolder,
  defaultLadyHolder,
  ladyEnabledByDefault,
  ladyHolderStats,
  ladyLied,
  ladyTargetOptions,
  ladyTruth,
  validateLadyUses,
} from './lady.ts'
import type { Game } from './types.ts'
import { uniformVotes } from './votes.ts'

function newGame(n = 7): Game {
  const players = makePlayers(defaultPlayerNames(n))
  return createGame({
    id: 'g',
    now: 'n',
    players,
    firstLeaderId: 'p1',
    lady: { initialHolderId: defaultLadyHolder(players, 'p1') },
  })
}

function quest(g: Game, fails: number): Game {
  const s = deriveState(g)
  const ids = g.players.map((p) => p.id)
  g = gameReducer(g, {
    type: 'propose',
    team: ids.slice(0, s.teamSize),
    votes: uniformVotes(ids, 'approve'),
    inputMode: 'approvals',
  })
  return gameReducer(g, { type: 'recordQuest', failCount: fails })
}

const run = (g: Game, ...a: GameAction[]) => a.reduce((x, y) => gameReducer(x, y), g)

describe('Lady of the Lake setup', () => {
  it('defaults the initial holder to the first leader right-hand neighbour', () => {
    const players = makePlayers(defaultPlayerNames(7))
    expect(defaultLadyHolder(players, 'p1')).toBe('p7')
    expect(defaultLadyHolder(players, 'p4')).toBe('p3')
  })
  it('is on by default for 7+ players', () => {
    expect(ladyEnabledByDefault(6)).toBe(false)
    expect(ladyEnabledByDefault(7)).toBe(true)
  })
})

describe('Lady of the Lake flow', () => {
  it('does not trigger after quest 1', () => {
    expect(deriveState(quest(newGame(), 0)).phase).toBe('proposal')
  })

  it('triggers after quests 2, 3 and 4 and passes to the target', () => {
    let g = quest(quest(newGame(), 0), 1)
    expect(deriveState(g)).toMatchObject({ phase: 'lady', questIndex: 1, ladyHolderId: 'p7' })
    g = run(g, { type: 'useLady', targetId: 'p3', declared: 'good' })
    expect(deriveState(g)).toMatchObject({ phase: 'proposal', questIndex: 2, ladyHolderId: 'p3' })
    g = quest(g, 1)
    expect(deriveState(g).phase).toBe('lady')
    g = run(g, { type: 'useLady', targetId: 'p5', declared: 'evil' })
    g = quest(g, 0)
    expect(deriveState(g)).toMatchObject({ phase: 'lady', questIndex: 3, ladyHolderId: 'p5' })
    g = run(g, { type: 'useLady', targetId: 'p1', declared: 'none' })
    expect(currentLadyHolder(g)).toBe('p1')
    expect(g.lady!.uses.map((u) => u.afterQuest)).toEqual([1, 2, 3])
    expect(deriveState(g).phase).toBe('proposal')
  })

  it('is not used when the game ended on that quest', () => {
    let g = newGame()
    g = quest(g, 1)
    g = quest(g, 1)
    expect(deriveState(g).phase).toBe('lady')
    g = run(g, { type: 'useLady', targetId: 'p1', declared: 'good' })
    g = quest(g, 1)
    expect(deriveState(g)).toMatchObject({ phase: 'finished', winner: 'evil' })
  })

  it('goes to assassination instead of the Lady after a third success', () => {
    let g = quest(quest(newGame(), 0), 0)
    g = run(g, { type: 'useLady', targetId: 'p1', declared: 'good' })
    g = quest(g, 0)
    expect(deriveState(g).phase).toBe('assassination')
  })

  it('rejects inspecting yourself or a previous holder', () => {
    let g = quest(quest(newGame(), 0), 1)
    expect(() => run(g, { type: 'useLady', targetId: 'p7', declared: 'good' })).toThrow(
      '不能查驗自己',
    )
    g = run(g, { type: 'useLady', targetId: 'p3', declared: 'good' })
    g = quest(g, 1)
    expect(() => run(g, { type: 'useLady', targetId: 'p7', declared: 'good' })).toThrow(
      GameRuleError,
    )
    const options = ladyTargetOptions(g, 1, 'p3')
    expect(options.find((o) => o.playerId === 'p7')!.disabledReason).toBe('曾持有過湖中女神')
    expect(options.find((o) => o.playerId === 'p3')!.disabledReason).toBe('不能查驗自己')
    expect(options.find((o) => o.playerId === 'p1')!.disabledReason).toBeNull()
  })

  it('undoes the Lady before the quest result', () => {
    let g = quest(quest(newGame(), 0), 1)
    g = run(g, { type: 'useLady', targetId: 'p3', declared: 'good' })
    g = undoLast(g)
    expect(g.lady!.uses).toEqual([])
    expect(deriveState(g).phase).toBe('lady')
    g = undoLast(g)
    expect(deriveState(g).phase).toBe('quest')
  })
})

function threeUses(): Game {
  let g = quest(quest(newGame(), 0), 1)
  g = run(g, { type: 'useLady', targetId: 'p3', declared: 'good' })
  g = quest(g, 1)
  g = run(g, { type: 'useLady', targetId: 'p5', declared: 'evil' })
  return g
}

describe('editing and validation', () => {
  it('is valid as recorded', () => {
    expect(validateLadyUses(threeUses())).toEqual([[], []])
  })

  it('flags later uses when an earlier target changes', () => {
    const g = run(threeUses(), { type: 'editLady', index: 0, patch: { targetId: 'p4' } })
    expect(validateLadyUses(g)).toEqual([[], ['持有者與前一次查驗結果不一致']])
  })

  it('flags a target that already held the Lady', () => {
    const g = run(threeUses(), { type: 'editLady', index: 1, patch: { targetId: 'p7' } })
    expect(validateLadyUses(g)[1]).toEqual(['曾持有過湖中女神'])
  })

  it('cannot proceed to the next quest without using the Lady', () => {
    let g = quest(quest(newGame(), 0), 1)
    expect(deriveState(g).phase).toBe('lady')
    const ids = g.players.map((p) => p.id)
    expect(() =>
      run(g, {
        type: 'propose',
        team: ids.slice(0, 3),
        votes: uniformVotes(ids, 'approve'),
        inputMode: 'approvals',
      }),
    ).toThrow(GameRuleError)
  })

  it('can change the initial holder and revalidates', () => {
    const g = run(threeUses(), { type: 'setLady', lady: { initialHolderId: 'p6' } })
    expect(validateLadyUses(g)[0]).toContain('持有者與前一次查驗結果不一致')
  })
})

describe('truth and lies', () => {
  it('compares declarations with known factions', () => {
    let g = quest(quest(newGame(), 0), 1)
    g = run(
      g,
      { type: 'setRoleAssignment', roleAssignment: { p3: 'morgana' } },
      { type: 'useLady', targetId: 'p3', declared: 'good' },
    )
    const use = g.lady!.uses[0]!
    expect(ladyTruth(g, use)).toBe('evil')
    expect(ladyLied(g, use)).toBe(true)
    expect(ladyHolderStats(g)).toEqual([
      { playerId: 'p7', uses: 1, honest: 0, lied: 1, unknown: 0 },
    ])
    const honest = run(g, { type: 'editLady', index: 0, patch: { declared: 'evil' } })
    expect(ladyLied(honest, honest.lady!.uses[0]!)).toBe(false)
    const silent = run(g, { type: 'editLady', index: 0, patch: { declared: 'none' } })
    expect(ladyLied(silent, silent.lady!.uses[0]!)).toBe(false)
  })

  it('does not judge when the target role is unknown', () => {
    let g = quest(quest(newGame(), 0), 1)
    g = run(g, { type: 'useLady', targetId: 'p3', declared: 'evil' })
    expect(ladyTruth(g, g.lady!.uses[0]!)).toBeNull()
    expect(ladyLied(g, g.lady!.uses[0]!)).toBe(false)
  })
})
