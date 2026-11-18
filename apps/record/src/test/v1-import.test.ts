/**
 * Regression: a backup written by 1.9.1's 「匯出全部 JSON」 (fixture produced by the
 * v1.9.1 code itself) still imports into 2.x unchanged and replays to the same results.
 */
import { deriveState, gamesToJson, parseGamesJson, type Game } from '@avalon/record-core'
import { afterEach, describe, expect, it } from 'vitest'
import { AvalonDB, DexieGameRepository } from '../db/dexie.ts'
import backup from './fixtures/v1.9.1-backup.json?raw'

const FINISHED = '0b6f6a52-5a9e-4c1e-9d0e-2f3a4b5c6d7e'
const LIVE = 'c7d1e2f3-0a1b-4c2d-8e3f-405162738495'

let db: AvalonDB
afterEach(async () => {
  await db?.delete()
})

function byId(games: readonly Game[], id: string): Game {
  return games.find((g) => g.id === id)!
}

describe('1.9.1 backup', () => {
  it('parses without errors', () => {
    const { games, errors } = parseGamesJson(backup)
    expect(errors).toEqual([])
    expect(games.map((g) => g.id).toSorted()).toEqual([FINISHED, LIVE].toSorted())
  })

  it('replays to the same results as in 1.9.1', () => {
    const { games } = parseGamesJson(backup)
    const done = byId(games, FINISHED)
    expect(deriveState(done)).toMatchObject({
      phase: 'finished',
      winner: 'good',
      successes: 3,
      fails: 1,
    })
    expect(done.name.custom).toBe('萬聖節團')
    expect(done.note).toBe('第一次加入派西維爾')
    expect(done.roleAssignment).toMatchObject({ p1: 'merlin', p5: 'assassin' })
    expect(done.lady?.uses.map((u) => [u.targetId, u.declared])).toEqual([
      ['p3', 'good'],
      ['p4', 'good'],
    ])

    const live = deriveState(byId(games, LIVE))
    expect(live).toMatchObject({ phase: 'proposal', winner: null })
  })

  it('imports into the 2.x database and exports back unchanged', async () => {
    db = new AvalonDB('avalon-record-import-test')
    const repo = new DexieGameRepository(db)
    const { games } = parseGamesJson(backup)
    let n = 0
    const summary = await repo.importMany(
      games.map((game) => ({ game })),
      () => `copy-${n++}`,
    )
    expect(summary).toMatchObject({ added: 2, overwritten: 0, copied: 0 })
    const stored = (await repo.load()).games
    expect(
      parseGamesJson(gamesToJson(stored)).games.toSorted((a, b) => a.id.localeCompare(b.id)),
    ).toEqual(games.toSorted((a, b) => a.id.localeCompare(b.id)))

    // Importing the same file again asks per game; overwrite keeps one copy each.
    const again = await repo.importMany(
      games.map((game) => ({ game, onConflict: 'overwrite' as const })),
      () => `copy-${n++}`,
    )
    expect(again).toMatchObject({ added: 0, overwritten: 2 })
    expect((await repo.load()).games).toHaveLength(2)
  })
})
