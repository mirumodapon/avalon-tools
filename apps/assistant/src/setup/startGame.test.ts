import { dealRoles, rolesInPlay } from '@avalon/pass-play'
import { deriveState } from '@avalon/record-core'
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

  it('draws the first leader', () => {
    const { game } = startGame(setup, NOW, pick(3))
    expect(game.firstLeaderId).toBe('p4')
    expect(deriveState(game).leaderId).toBe('p4')
  })

  it('gives the Lady to the last seat by default', () => {
    expect(startGame(setup, NOW, pick(3)).game.lady!.initialHolderId).toBe('p7')
  })

  it('gives the Lady to the chosen seat', () => {
    const chosen = { ...setup, ladyHolderSeat: 2 }
    expect(startGame(chosen, NOW, pick(3)).game.lady!.initialHolderId).toBe('p2')
  })

  it('draws the Lady holder at random when asked', () => {
    const random = { ...setup, ladyHolderSeat: 2, ladyHolderRandom: true }
    expect(startGame(random, NOW, pick(4)).game.lady!.initialHolderId).toBe('p5')
    expect(startGame(random, NOW, pick(0)).game.lady!.initialHolderId).toBe('p1')
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
