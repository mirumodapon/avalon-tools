import { describe, expect, it } from 'vitest'
import {
  assassinationHit,
  createGame,
  defaultPlayerNames,
  deriveState,
  gameReducer,
  makePlayers,
} from './game.ts'
import {
  defaultRoleConfig,
  playerFaction,
  remainingFor,
  teamHasEvil,
  validateAssignment,
  validateRoleConfig,
} from './roles.ts'
import { factionCounts, PLAYER_COUNTS } from './rules.ts'
import { playerStats } from './stats.ts'
import type { Game } from './types.ts'
import { uniformVotes, votesFromApprovals } from './votes.ts'

describe('role config', () => {
  it.each(PLAYER_COUNTS)('default config for %i players is valid', (n) => {
    const check = validateRoleConfig(defaultRoleConfig(n), n)
    expect(check.ok).toBe(true)
    expect(check.counts).toEqual(factionCounts(n))
    expect(check.warnings).toEqual([])
  })

  it('rejects faction counts that do not match', () => {
    const check = validateRoleConfig({ merlin: 1, loyal: 1, morgana: 1, assassin: 1, minion: 1 }, 5)
    expect(check.ok).toBe(false)
    expect(check.errors).toEqual(['好人需要 3 位（目前 2 位）', '壞人需要 2 位（目前 3 位）'])
  })

  it('rejects duplicates of unique roles', () => {
    const check = validateRoleConfig({ merlin: 2, loyal: 1, assassin: 1, minion: 1 }, 5)
    expect(check.errors).toContain('梅林 最多 1 位')
  })

  it('warns when Merlin has no assassin', () => {
    const check = validateRoleConfig({ merlin: 1, loyal: 2, minion: 2 }, 5)
    expect(check.ok).toBe(true)
    expect(check.warnings).toEqual(['有梅林但沒有刺客，將無法進行刺殺'])
  })
})

describe('role assignment', () => {
  const config = defaultRoleConfig(5)

  it('allows partial assignment', () => {
    expect(validateAssignment({ p1: 'merlin' }, config, 5)).toEqual([])
  })

  it('rejects more copies than configured', () => {
    expect(validateAssignment({ p1: 'loyal', p2: 'loyal' }, config, 5)).toEqual([
      '亞瑟的忠臣 指派了 2 位，但配置只有 1 位',
    ])
  })

  it('limits by faction without a config', () => {
    expect(validateAssignment({ p1: 'minion', p2: 'minion', p3: 'minion' }, null, 5)).toEqual([
      '壞人最多 2 位',
    ])
  })

  it('computes remaining copies, excluding the player own role', () => {
    const a = { p1: 'merlin' as const, p2: 'loyal' as const }
    expect(remainingFor('merlin', 'p3', a, config, 5)).toBe(0)
    expect(remainingFor('merlin', 'p1', a, config, 5)).toBe(1)
    expect(remainingFor('loyal', 'p3', a, config, 5)).toBe(0)
    expect(remainingFor('minion', 'p3', a, config, 5)).toBe(0)
    expect(remainingFor('minion', 'p3', a, null, 5)).toBe(2)
    expect(remainingFor('percival', 'p3', a, null, 5)).toBe(1)
  })
})

function playedTo3Successes(): Game {
  let g = createGame({
    id: 'g',
    now: 'n',
    players: makePlayers(defaultPlayerNames(5)),
    roleAssignment: { p1: 'merlin', p4: 'assassin' },
  })
  const ids = g.players.map((p) => p.id)
  for (const size of [2, 3, 2]) {
    g = gameReducer(g, {
      type: 'propose',
      team: ids.slice(0, size),
      votes: uniformVotes(ids, 'approve'),
      inputMode: 'approvals',
    })
    g = gameReducer(g, { type: 'recordQuest', failCount: 0 })
  }
  return g
}

describe('assassination auto-judgement', () => {
  it('hits when the target is the assigned Merlin, ignoring manual input', () => {
    const g = gameReducer(playedTo3Successes(), {
      type: 'assassinate',
      targetId: 'p1',
      manualHit: false,
    })
    expect(assassinationHit(g, g.assassination)).toBe(true)
    expect(deriveState(g)).toMatchObject({ winner: 'evil', winReason: 'assassination-hit' })
  })

  it('misses when the target is not Merlin', () => {
    const g = gameReducer(playedTo3Successes(), {
      type: 'assassinate',
      targetId: 'p2',
      manualHit: null,
    })
    expect(deriveState(g)).toMatchObject({ winner: 'good', winReason: 'assassination-missed' })
  })

  it('falls back to manual judgement when Merlin is unknown', () => {
    let g = playedTo3Successes()
    g = gameReducer(g, { type: 'setRoleAssignment', roleAssignment: {} })
    g = gameReducer(g, { type: 'assassinate', targetId: 'p2', manualHit: true })
    expect(deriveState(g).winner).toBe('evil')
  })

  it('stays in assassination when Merlin is unknown and no manual result is given', () => {
    let g = playedTo3Successes()
    g = gameReducer(g, { type: 'setRoleAssignment', roleAssignment: {} })
    g = gameReducer(g, { type: 'assassinate', targetId: 'p2', manualHit: null })
    expect(deriveState(g).phase).toBe('assassination')
  })

  it('re-judges when roles are filled in later', () => {
    let g = playedTo3Successes()
    g = gameReducer(g, { type: 'setRoleAssignment', roleAssignment: {} })
    g = gameReducer(g, { type: 'assassinate', targetId: 'p2', manualHit: false })
    expect(deriveState(g).winner).toBe('good')
    g = gameReducer(g, { type: 'setRoleAssignment', roleAssignment: { p2: 'merlin' } })
    expect(deriveState(g).winner).toBe('evil')
  })
})

describe('faction helpers and stats', () => {
  it('derives factions and evil teams', () => {
    const g = { roleAssignment: { p1: 'morgana' as const, p2: 'loyal' as const } }
    expect(playerFaction(g, 'p1')).toBe('evil')
    expect(playerFaction(g, 'p3')).toBeNull()
    expect(teamHasEvil(g, ['p2', 'p3'])).toBe(false)
    expect(teamHasEvil(g, ['p1', 'p2'])).toBe(true)
  })

  it('computes per-player stats', () => {
    let g = createGame({
      id: 'g',
      now: 'n',
      players: makePlayers(defaultPlayerNames(5)),
      roleAssignment: { p2: 'morgana' },
    })
    const ids = g.players.map((p) => p.id)
    g = gameReducer(g, {
      type: 'propose',
      team: ['p1', 'p2'],
      votes: votesFromApprovals(ids, ['p1', 'p2']),
      inputMode: 'approvals',
    })
    g = gameReducer(g, {
      type: 'propose',
      team: ['p3', 'p4'],
      votes: votesFromApprovals(ids, ['p1', 'p3', 'p4']),
      inputMode: 'approvals',
    })
    const [p1, p2] = playerStats(g)
    expect(p1).toMatchObject({
      votes: 2,
      approvals: 2,
      approveRate: 1,
      approvalsForEvilTeams: 1,
      timesLeader: 1,
      ledTeamsWithEvil: 1,
    })
    expect(p2).toMatchObject({
      faction: 'evil',
      approvals: 1,
      approveRate: 0.5,
      timesLeader: 1,
      ledTeamsWithEvil: 0,
    })
  })
})
