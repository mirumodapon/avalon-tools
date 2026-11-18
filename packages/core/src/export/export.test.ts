import { describe, expect, it } from 'vitest'
import { createGame, gameReducer, makePlayers } from '../game.ts'
import type { Game } from '../types.ts'
import { votesFromAnomalies, votesFromApprovals } from '../votes.ts'
import { gameToCsv } from './csv.ts'
import { gamesToJson, gameToJson, parseGamesJson } from './json.ts'
import { gameToMarkdown } from './markdown.ts'
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

describe('CSV', () => {
  it('writes full votes regardless of input mode', () => {
    const lines = gameToCsv(sample(), opts()).replace(/^﻿/, '').split('\r\n')
    expect(lines[0]).toBe(
      '任務,派票次數,隊長,隊員,強制局,贊成數,阿明,小華,小美,大雄,靜香,胖虎,小夫,派票結果,任務結果,失敗票數,備註',
    )
    expect(lines[1]).toBe('1,1,阿明,阿明、小華,,2,贊成,反對,反對,贊成,反對,反對,反對,否決,,,')
    expect(lines[2]).toBe('1,2,小華,阿明、小華,,5,贊成,贊成,反對,贊成,贊成,贊成,反對,通過,失敗,1,')
  })

  it('writes only anomalies in anomaly view', () => {
    const lines = gameToCsv(sample(), opts({ viewMode: 'anomaly' })).split('\r\n')
    expect(lines[1]).toContain(',2,,場內黑,,場外白,,,,否決')
    expect(lines[2]).toContain(',5,,,,場外白,場外白,場外白,,通過')
  })

  it('escapes quotes and commas and adds lady rows', () => {
    const csv = gameToCsv(sample(), opts())
    expect(csv).toContain('"在咖啡廳, ""精彩"""')
    expect(csv).toContain('湖中女神：小夫 → 小華：宣告好人')
    expect(csv.startsWith('﻿')).toBe(true)
  })

  it('includes roles only when asked', () => {
    expect(gameToCsv(sample(), opts())).not.toMatch(ROLE_WORDS)
    const withRoles = gameToCsv(sample(), opts({ includeRoles: true }))
    expect(withRoles).toContain('阿明(梅林)')
    expect(withRoles).toContain('宣告好人（實際壞人，說謊）')
  })
})

describe('Markdown', () => {
  it('starts with the name and note, and renders the vote table', () => {
    const md = gameToMarkdown(sample(), opts())
    expect(md.startsWith('# 2026-11-18 第3場\n\n> 在咖啡廳, "精彩"')).toBe(true)
    expect(md).toContain('| 1-1 | 👑阿明 | 阿明、小華 | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 否決 |')
    expect(md).toContain('任務：❌✅⚪⚪⚪')
  })

  it('shows only anomalies in anomaly view', () => {
    const md = gameToMarkdown(sample(), opts({ viewMode: 'anomaly' }))
    expect(md).toContain(
      '| 1-1 | 👑阿明 | 阿明、小華 |  | 👎場內黑 |  | 👍場外白 |  |  |  | 否決 |',
    )
  })

  it('hides roles unless included', () => {
    expect(gameToMarkdown(sample(), opts())).not.toMatch(ROLE_WORDS)
    expect(gameToMarkdown(sample(), opts({ includeRoles: true }))).toContain('阿明(🧙梅林)')
  })
})

describe('plain text', () => {
  it('summarises quests briefly', () => {
    const t = gameToText(sample(), opts())
    expect(t).toContain('【2026-11-18 第3場】')
    expect(t).toContain('任務1（2人，第2次）❌1敗：阿明、小華（5票通過）')
    expect(t).not.toMatch(ROLE_WORDS)
  })

  it('lists anomalies in anomaly view', () => {
    expect(gameToText(sample(), opts({ viewMode: 'anomaly' }))).toContain(
      '（場外白 大雄、靜香、胖虎）',
    )
  })

  it('adds roles when included', () => {
    expect(gameToText(sample(), opts({ includeRoles: true }))).toContain(
      '角色：阿明(🧙梅林)、小華(🎭莫甘娜)、小美(🗡️刺客)',
    )
  })
})
