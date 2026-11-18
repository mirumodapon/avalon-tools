import { describe, expect, it } from 'vitest'
import { createGame, defaultPlayerNames, gameReducer, makePlayers } from './game.ts'
import { migrateGame, parseGame } from './schema.ts'
import { SCHEMA_VERSION } from './types.ts'
import { uniformVotes } from './votes.ts'

function sample() {
  let g = createGame({
    id: 'g1',
    now: '2026-11-18T10:00:00.000Z',
    players: makePlayers(defaultPlayerNames(7)),
    name: { custom: '週五團', auto: '2026-11-18 第1場', seq: 1 },
    note: '咖啡廳',
    roleAssignment: { p1: 'merlin' },
    lady: { initialHolderId: 'p7' },
  })
  const ids = g.players.map((p) => p.id)
  g = gameReducer(
    g,
    {
      type: 'propose',
      team: ['p1', 'p2'],
      votes: uniformVotes(ids, 'approve'),
      inputMode: 'anomalies',
    },
    '2026-11-18T10:05:00.000Z',
  )
  return gameReducer(g, { type: 'recordQuest', failCount: 0 }, '2026-11-18T10:06:00.000Z')
}

describe('parseGame', () => {
  it('accepts a valid game unchanged (JSON round-trip)', () => {
    const g = sample()
    const r = parseGame(JSON.parse(JSON.stringify(g)))
    expect(r).toEqual({ ok: true, game: g })
  })

  it('reports readable errors', () => {
    const g = { ...sample(), players: [] }
    const r = parseGame(g)
    expect(r).toEqual({ ok: false, error: expect.stringContaining('人數必須為 5–10 人') })
  })

  it('rejects references to unknown players', () => {
    const g = sample()
    g.rounds[0]!.proposals[0]!.team = ['p1', 'p99']
    const r = parseGame(g)
    expect(r).toEqual({
      ok: false,
      error: expect.stringContaining('rounds.0.proposals.0.team：隊員不在玩家中'),
    })
  })

  it('rejects non-objects and missing versions', () => {
    expect(parseGame(null)).toEqual({ ok: false, error: '遊戲資料必須是物件' })
    expect(parseGame({})).toEqual({ ok: false, error: '缺少有效的 schemaVersion' })
  })

  it('rejects data from a newer version', () => {
    const r = parseGame({ ...sample(), schemaVersion: SCHEMA_VERSION + 1 })
    expect(r).toEqual({ ok: false, error: expect.stringContaining('請先更新程式') })
  })
})

describe('migrateGame', () => {
  it('runs registered migrations in order up to the target version', () => {
    const steps = {
      1: (raw: Record<string, unknown>) => ({ ...raw, note: `${raw.note as string}+v2` }),
      2: (raw: Record<string, unknown>) => ({ ...raw, note: `${raw.note as string}+v3` }),
    }
    const out = migrateGame({ ...sample(), schemaVersion: 1 }, steps, 3) as Record<string, unknown>
    expect(out.schemaVersion).toBe(3)
    expect(out.note).toBe('咖啡廳+v2+v3')
  })

  it('fails clearly when a migration step is missing', () => {
    expect(() => migrateGame({ ...sample(), schemaVersion: 1 }, {}, 2)).toThrow(
      '缺少版本 1 → 2 的 migration',
    )
  })

  it('passes through the current version', () => {
    const g = sample()
    expect(migrateGame(g)).toEqual(g)
  })
})
