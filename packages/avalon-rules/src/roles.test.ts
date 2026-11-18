import { describe, expect, it } from 'vitest'
import { defaultRoleConfig, remainingFor, validateAssignment, validateRoleConfig } from './roles.ts'
import { factionCounts, PLAYER_COUNTS } from './rules.ts'

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
