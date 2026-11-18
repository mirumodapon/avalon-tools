import {
  createGame,
  defaultPlayerNames,
  gameReducer,
  makePlayers,
  uniformVotes,
} from '@avalon/core'
import { describe, expect, it } from 'vitest'
import { decodeGame, encodeGame } from './link.ts'

function game() {
  let g = createGame({
    id: '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f',
    now: '2026-11-18T12:00:00.000Z',
    players: makePlayers(defaultPlayerNames(10)),
    note: '在咖啡廳',
  })
  const ids = g.players.map((p) => p.id)
  for (let i = 0; i < 4; i++) {
    g = gameReducer(g, {
      type: 'propose',
      team: ids.slice(0, 3),
      votes: uniformVotes(ids, 'reject'),
      inputMode: 'approvals',
    })
  }
  return g
}

describe('share link encoding', () => {
  it('round-trips through the URL parameter', async () => {
    const g = game()
    const param = await encodeGame(g)
    expect(param).toMatch(/^[zj][A-Za-z0-9_-]+$/)
    const back = await decodeGame(param)
    expect(back.rounds).toEqual(g.rounds)
    expect(back.note).toBe('在咖啡廳')
    expect(back.id).toBe(g.id)
  })

  it('stays short', async () => {
    expect((await encodeGame(game())).length).toBeLessThan(200)
  })

  it('rejects garbage', async () => {
    await expect(decodeGame('xabc')).rejects.toThrow('分享連結格式不支援或已損毀')
    await expect(decodeGame('jbm90IGpzb24')).rejects.toThrow('分享連結格式不支援或已損毀')
  })
})
