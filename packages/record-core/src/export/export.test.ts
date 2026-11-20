import { describe, expect, it } from 'vitest'
import { createGame, gameReducer, makePlayers } from '../game.ts'
import type { Game } from '../types.ts'
import { votesFromAnomalies, votesFromApprovals } from '../votes.ts'
import { gamesToJson, gameToJson, parseGamesJson } from './json.ts'
import { gameToText } from './text.ts'
import type { ExportOptions } from './common.ts'

const ids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']

function sample(): Game {
  let g = createGame({
    id: 'g1',
    now: '2026-11-18T10:00:00.000Z',
    players: makePlayers(['阿明', '小華', '小美', '大雄', '靜香', '胖虎', '小夫']),
    name: { custom: null, auto: '2026-11-18 第3場', seq: 3 },
    note: '在咖啡廳, "精彩"',
    roleAssignment: { p1: 'merlin', p2: 'morgana', p3: 'assassin' },
    lady: { initialHolderId: 'p7' },
  })
  // 1-1 entered as approvals: team p1,p2; approvers p1,p4 → p2 場內黑, p4 場外白
  g = gameReducer(g, {
    type: 'propose',
    team: ['p1', 'p2'],
    votes: votesFromApprovals(ids, ['p1', 'p4']),
    inputMode: 'approvals',
  })
  // 1-2 entered as anomalies: same pattern
  g = gameReducer(g, {
    type: 'propose',
    team: ['p1', 'p2'],
    votes: votesFromAnomalies(ids, ['p1', 'p2'], {
      outsideApprove: ['p4', 'p5', 'p6'],
      insideReject: [],
    }),
    inputMode: 'anomalies',
  })
  g = gameReducer(g, { type: 'recordQuest', failCount: 1 })
  g = gameReducer(g, {
    type: 'propose',
    team: ['p1', 'p3', 'p4'],
    votes: votesFromApprovals(ids, ids),
    inputMode: 'approvals',
  })
  g = gameReducer(g, { type: 'recordQuest', failCount: 0 })
  return gameReducer(g, { type: 'useLady', targetId: 'p2', declared: 'good' })
}

const opts = (o: Partial<ExportOptions> = {}): ExportOptions => ({
  name: '2026-11-18 第3場',
  viewMode: 'full',
  includeRoles: false,
  ...o,
})

const ROLE_WORDS = /梅林|莫甘娜|刺客|好人勝|壞人勝|🧙|🎭|實際|說謊/

describe('JSON', () => {
  it('round-trips a game exactly, including name, note, roles and lady', () => {
    const g = sample()
    const r = parseGamesJson(gameToJson(g))
    expect(r.errors).toEqual([])
    expect(r.games).toEqual([g])
  })

  it('exports and imports many games', () => {
    const g = sample()
    const r = parseGamesJson(gamesToJson([g, { ...g, id: 'g2' }]))
    expect(r.games.map((x) => x.id)).toEqual(['g1', 'g2'])
  })

  it('reports invalid JSON and invalid items', () => {
    expect(parseGamesJson('{').errors[0]!.error).toContain('不是有效的 JSON')
    expect(parseGamesJson('[]').errors[0]!.error).toBe('檔案中沒有任何遊戲')
    const r = parseGamesJson(JSON.stringify([sample(), { schemaVersion: 1 }]))
    expect(r.games).toHaveLength(1)
    expect(r.errors[0]!.index).toBe(1)
  })
})

describe('plain text', () => {
  it('records every proposal with full votes', () => {
    const t = gameToText(sample(), opts())
    expect(t).toContain('【2026-11-18 第3場】')
    expect(t).toContain('玩家：1.阿明 2.小華 3.小美 4.大雄 5.靜香 6.胖虎 7.小夫')
    expect(t).toContain(
      [
        '任務1・2人',
        '1. 👑阿明｜隊員：阿明、小華｜否決',
        '   贊成 2：阿明、大雄｜反對 5：小華、小美、靜香、胖虎、小夫',
        '2. 👑小華｜隊員：阿明、小華｜通過',
        '   贊成 5：阿明、小華、大雄、靜香、胖虎｜反對 2：小美、小夫',
        '→ ❌任務失敗・失敗票 1 張',
      ].join('\n'),
    )
    expect(t).toContain('→ ✅任務成功・失敗票 0 張\n🌊湖中女神：小夫 → 小華：宣告好人')
    expect(t).not.toMatch(ROLE_WORDS)
  })

  it('lists only anomalies in anomaly view', () => {
    const t = gameToText(sample(), opts({ viewMode: 'anomaly' }))
    expect(t).toContain('1. 👑阿明｜隊員：阿明、小華｜否決\n   場外白：大雄｜場內黑：小華')
    expect(t).toContain('   場外白：大雄、靜香、胖虎')
  })

  it('adds roles when included', () => {
    const t = gameToText(sample(), opts({ includeRoles: true }))
    expect(t).toContain('角色：阿明(🧙梅林)、小華(🎭莫甘娜)、小美(🗡️刺客)')
    expect(t).toContain('宣告好人（實際壞人，說謊）')
  })
})
