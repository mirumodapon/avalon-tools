import { describe, expect, it } from 'vitest'
import { createGame, defaultPlayerNames, deriveState, gameReducer, makePlayers } from './game.ts'
import { ladyTargetOptions } from './lady.ts'
import { decodeGame, encodeGame, recordShareUrl } from './share-link.ts'
import type { Game } from './types.ts'
import { uniformVotes } from './votes.ts'

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

/** 10 players, 5 quests each settled on the 5th proposal, the Lady used three times. */
function maximalGame(): Game {
  const players = makePlayers(defaultPlayerNames(10).map((n, i) => `${n}・玩家名字${i}`))
  let g = createGame({
    id: '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f',
    now: '2026-11-18T12:00:00.000Z',
    players,
    lady: { initialHolderId: players[9]!.id },
  })
  const ids = players.map((p) => p.id)
  for (let quest = 0; quest < 5; quest++) {
    const s = deriveState(g)
    const team = ids.slice(0, s.teamSize)
    for (let i = 0; i < 4; i++) {
      g = gameReducer(g, {
        type: 'propose',
        team,
        votes: uniformVotes(ids, 'reject'),
        inputMode: 'approvals',
      })
    }
    g = gameReducer(g, {
      type: 'propose',
      team,
      votes: uniformVotes(ids, 'approve'),
      inputMode: 'approvals',
    })
    // success, fail, success, fail, success: the game reaches the 5th quest
    const failCount = quest % 2 === 1 ? deriveState(g).failsRequired : 0
    g = gameReducer(g, { type: 'recordQuest', failCount })
    const after = deriveState(g)
    if (after.phase === 'lady') {
      const target = ladyTargetOptions(g, g.lady!.uses.length, after.ladyHolderId!).find(
        (o) => o.disabledReason === null,
      )!
      g = gameReducer(g, { type: 'useLady', targetId: target.playerId, declared: 'evil' })
    }
  }
  return g
}

describe('maximal games', () => {
  it('round-trips a maximal 10-player game', async () => {
    const g = maximalGame()
    expect(g.rounds).toHaveLength(5)
    expect(g.lady!.uses).toHaveLength(3)
    // The share format does not carry updatedAt; decoding stamps the current time.
    const { updatedAt: _, ...back } = await decodeGame(await encodeGame(g))
    const { updatedAt: __, ...expected } = g
    expect(back).toEqual(expected)
  })

  it('builds a link to the record app', async () => {
    const url = await recordShareUrl(maximalGame(), 'https://a.b', '/record/')
    expect(url.startsWith('https://a.b/record/?s=')).toBe(true)
    const param = new URL(url).searchParams.get('s')!
    expect((await decodeGame(param)).rounds).toEqual(maximalGame().rounds)
  })
})
