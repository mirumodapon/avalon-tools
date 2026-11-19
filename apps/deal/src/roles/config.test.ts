import { describe, expect, it } from 'vitest'
import { PLAYER_COUNTS } from '@avalon/rules'
import { checkConfig, defaultSpecialFor, rolesInPlay } from './config.ts'

describe('checkConfig', () => {
  it('accepts the default Merlin + Assassin', () => {
    const c = checkConfig({ playerCount: 5, special: ['merlin', 'assassin'] })
    expect(c).toMatchObject({ ok: true, errors: [], warnings: [], notes: [] })
    expect(c.required).toEqual({ good: 3, evil: 2 })
  })

  it.each([
    [5, 3, 2],
    [6, 4, 2],
    [7, 4, 3],
    [8, 5, 3],
    [9, 6, 3],
    [10, 6, 4],
  ] as const)('%i players: %i good, %i evil', (playerCount, good, evil) => {
    expect(checkConfig({ playerCount, special: [] }).required).toEqual({ good, evil })
  })

  it('blocks more special evil roles than evil seats', () => {
    const c = checkConfig({ playerCount: 5, special: ['assassin', 'morgana', 'oberon'] })
    expect(c.ok).toBe(false)
    expect(c.errors).toEqual(['特殊壞人有 3 位，但 5 人只有 2 位壞人'])
  })

  it('allows special roles to fill a whole faction', () => {
    expect(
      checkConfig({ playerCount: 10, special: ['assassin', 'morgana', 'mordred', 'oberon'] }).ok,
    ).toBe(true)
  })

  it('warns about Percival without Merlin', () => {
    const c = checkConfig({ playerCount: 7, special: ['percival', 'assassin'] })
    expect(c.ok).toBe(true)
    expect(c.warnings).toEqual(['有派西維爾但沒有梅林，派西維爾沒有人可以保護'])
  })

  it('notes that Morgana does nothing without Percival', () => {
    const c = checkConfig({ playerCount: 7, special: ['merlin', 'assassin', 'morgana'] })
    expect(c.notes).toEqual(['沒有派西維爾，莫甘娜的能力沒有作用'])
    expect(
      checkConfig({ playerCount: 7, special: ['merlin', 'percival', 'morgana'] }).notes,
    ).toEqual([])
  })
})

describe('rolesInPlay', () => {
  it('fills the remaining seats with loyal servants and minions', () => {
    expect(rolesInPlay({ playerCount: 7, special: ['merlin', 'assassin'] }).toSorted()).toEqual(
      ['assassin', 'loyal', 'loyal', 'loyal', 'merlin', 'minion', 'minion'].toSorted(),
    )
  })

  it('refuses an invalid configuration', () => {
    expect(() =>
      rolesInPlay({
        playerCount: 5,
        special: ['merlin', 'percival', 'assassin', 'morgana', 'mordred'],
      }),
    ).toThrow(/壞人/)
  })
})

describe('defaultSpecialFor', () => {
  it('turns on the usual roles for each table size', () => {
    expect(defaultSpecialFor(5)).toEqual(['merlin', 'assassin'])
    expect(defaultSpecialFor(6)).toEqual(['merlin', 'percival', 'assassin', 'morgana'])
    for (const n of [7, 8, 9] as const) {
      expect(defaultSpecialFor(n)).toEqual(['merlin', 'percival', 'assassin', 'morgana', 'mordred'])
    }
    expect(defaultSpecialFor(10)).toEqual([
      'merlin',
      'percival',
      'assassin',
      'morgana',
      'mordred',
      'oberon',
    ])
  })

  it('is always a valid setup', () => {
    for (const playerCount of PLAYER_COUNTS) {
      expect(checkConfig({ playerCount, special: defaultSpecialFor(playerCount) }).errors).toEqual(
        [],
      )
    }
  })
})
