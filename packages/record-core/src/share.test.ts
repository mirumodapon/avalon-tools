import { describe, expect, it } from 'vitest'
import { createGame, deriveState, gameReducer, makePlayers } from './game.ts'
import { packGame, ShareFormatError, unpackGame } from './share.ts'
import type { Game } from './types.ts'
import { uniformVotes, votesFromApprovals } from './votes.ts'

const names = [
  '阿明',
  '小華',
  '小美',
  '大雄',
  '靜香',
  '胖虎',
  '小夫',
  '出木杉',
  '哆啦A夢',
  '技安的妹妹',
]
const ids = names.map((_, i) => `p${i + 1}`)

/** A finished 10-player game: forced proposal, lady chain, roles, assassination. */
function fullGame(): Game {
  let g = createGame({
    id: '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f',
    now: '2026-11-18T12:05:31.000Z',
    players: makePlayers(names),
    firstLeaderId: 'p3',
    name: { custom: '週五團', auto: 'x', seq: 4 },
    note: '在咖啡廳\n第二行',
    roleConfig: {
      merlin: 1,
      percival: 1,
      loyal: 4,
      morgana: 1,
      assassin: 1,
      mordred: 1,
      oberon: 1,
    },
    roleAssignment: { p1: 'merlin', p4: 'assassin', p9: 'morgana' },
    lady: { initialHolderId: 'p2' },
  })
  const play = (
    team: string[],
    approvers: string[],
    mode: 'approvals' | 'anomalies' = 'approvals',
  ) => {
    g = gameReducer(g, {
      type: 'propose',
      team,
      votes: votesFromApprovals(ids, approvers),
      inputMode: mode,
    })
  }
  for (let i = 0; i < 4; i++) play(['p1', 'p2', 'p3'], ['p1'])
  play(['p1', 'p2', 'p3'], ids, 'anomalies') // forced (5th) proposal, approved
  g = gameReducer(g, { type: 'recordQuest', failCount: 0 })
  play(['p4', 'p5', 'p6', 'p7'], ids.slice(0, 7), 'anomalies')
  g = gameReducer(g, { type: 'recordQuest', failCount: 1 })
  g = gameReducer(g, { type: 'useLady', targetId: 'p9', declared: 'good', note: '說謊？' })
  play(['p1', 'p5', 'p6', 'p10'], ids)
  g = gameReducer(g, { type: 'recordQuest', failCount: 0 })
  g = gameReducer(g, { type: 'useLady', targetId: 'p5', declared: 'none' })
  play(['p1', 'p2', 'p5', 'p6', 'p10'], ids)
  g = gameReducer(g, { type: 'recordQuest', failCount: 1 })
  g = gameReducer(g, { type: 'assassinate', targetId: 'p6', manualHit: null })
  return { ...g, savedAt: g.updatedAt }
}

const NOW = '2026-11-19T00:00:00.000Z'
const roundTrip = (g: Game) => unpackGame(JSON.parse(JSON.stringify(packGame(g))), NOW)

describe('share format', () => {
  it('round-trips everything except timestamps precision and the auto-name snapshot', () => {
    const g = fullGame()
    expect(deriveState(g).phase).toBe('finished')
    const back = roundTrip(g)
    expect(back).toEqual({
      ...g,
      updatedAt: NOW,
      savedAt: NOW,
      name: { ...g.name, auto: '' },
    })
  })

  it('keeps unfinished games unfinished and unsaved', () => {
    let g = createGame({
      id: 'plain-id',
      now: '2026-11-18T12:00:00.000Z',
      players: makePlayers(names.slice(0, 5)),
    })
    g = gameReducer(g, {
      type: 'propose',
      team: ['p1', 'p2'],
      votes: uniformVotes(ids.slice(0, 5), 'reject'),
      inputMode: 'approvals',
    })
    const back = roundTrip(g)
    expect(back.id).toBe('plain-id')
    expect(back.savedAt).toBeNull()
    expect(back.rounds).toEqual(g.rounds)
    expect(back.lady).toBeNull()
    expect(back.roleConfig).toBeNull()
  })

  it('is compact', () => {
    const json = JSON.stringify(packGame(fullGame()))
    expect(json.length).toBeLessThan(300)
    expect(json.length).toBeLessThan(JSON.stringify(fullGame()).length / 10)
  })

  it('rejects malformed data', () => {
    expect(() => unpackGame(null)).toThrow(ShareFormatError)
    expect(() => unpackGame([99])).toThrow('分享連結格式不支援或已損毀')
    const packed = packGame(fullGame())
    packed[3] = ['只有', '兩人']
    expect(() => unpackGame(packed)).toThrow(ShareFormatError)
  })
})
