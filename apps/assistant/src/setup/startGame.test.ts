import { dealRoles, rolesInPlay } from '@avalon/pass-play'
import { defaultLadyHolder, deriveState } from '@avalon/record-core'
import { describe, expect, it } from 'vitest'
import { normalizeSetup } from './settings.ts'
import { startGame } from './startGame.ts'

const NOW = '2026-11-20T12:00:00.000Z'
/** Always picks index `k` (clamped): deterministic shuffles and leaders. */
const pick = (k: number) => (max: number) => Math.min(k, max - 1)

describe('startGame', () => {
  const setup = normalizeSetup({ playerCount: 7, names: ['小明', '', '小華'] })

  it('deals the roles onto the seats', () => {
    const { game, table } = startGame(setup, NOW, pick(0))
    expect(table).toEqual(dealRoles(rolesInPlay(setup), pick(0)))
    for (const { seat, role } of table) expect(game.roleAssignment[`p${seat}`]).toBe(role)
    expect(Object.values(game.roleConfig!).reduce((a, b) => a + b, 0)).toBe(7)
  })

  it('names the players, blank seats by number', () => {
    const { game } = startGame(setup, NOW, pick(0))
    expect(game.players.map((p) => p.name)).toEqual([
      '小明',
      '2號',
      '小華',
      '4號',
      '5號',
      '6號',
      '7號',
    ])
  })

  it('draws the first leader and gives the Lady to their right', () => {
    const { game } = startGame(setup, NOW, pick(3))
    expect(game.firstLeaderId).toBe('p4')
    expect(deriveState(game).leaderId).toBe('p4')
    expect(game.lady!.initialHolderId).toBe(defaultLadyHolder(game.players, 'p4'))
  })

  it('leaves the Lady out when it is off', () => {
    expect(startGame({ ...setup, lady: false }, NOW, pick(0)).game.lady).toBeNull()
  })

  it('names the game like the record app does', () => {
    expect(startGame(setup, NOW, pick(0)).game.name.auto).toMatch(/^\d{4}-\d{2}-\d{2} 第1場$/)
  })

  it('starts with duplicate names', () => {
    const dup = normalizeSetup({ playerCount: 5, names: ['阿明', '阿明'] })
    expect(startGame(dup, NOW, pick(0)).game.players).toHaveLength(5)
  })
})
