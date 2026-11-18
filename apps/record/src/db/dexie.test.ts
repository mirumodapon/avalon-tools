import 'fake-indexeddb/auto'
import { createGame, defaultPlayerNames, makePlayers, type Game } from '@avalon/record-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AvalonDB, DexieGameRepository } from './dexie.ts'

let db: AvalonDB
let repo: DexieGameRepository
let n = 0

function game(id: string, createdAt = '2026-11-18T10:00:00.000Z'): Game {
  return createGame({
    id,
    now: createdAt,
    players: makePlayers(defaultPlayerNames(5)),
    name: { seq: 4 },
  })
}

beforeEach(() => {
  db = new AvalonDB(`test-${n++}`)
  repo = new DexieGameRepository(db)
})
afterEach(async () => {
  await db.delete()
})

describe('DexieGameRepository', () => {
  it('stores one record per game with derived indexes', async () => {
    await repo.put(game('a'))
    const rec = await db.games.get('a')
    expect(rec).toMatchObject({ id: 'a', winner: 'none', schemaVersion: 1 })
    expect(rec!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(await db.games.where('winner').equals('none').count()).toBe(1)
  })

  it('loads newest first', async () => {
    await repo.put(game('old', '2026-11-01T00:00:00.000Z'))
    await repo.put(game('new', '2026-11-18T00:00:00.000Z'))
    expect((await repo.load()).games.map((g) => g.id)).toEqual(['new', 'old'])
  })

  it('skips invalid records instead of failing', async () => {
    await repo.put(game('ok'))
    await db.games.put({ ...(await db.games.get('ok'))!, id: 'bad', game: { nope: true } as never })
    const r = await repo.load()
    expect(r.games.map((g) => g.id)).toEqual(['ok'])
    expect(r.skipped[0]!.id).toBe('bad')
  })

  it('removes and clears', async () => {
    await repo.put(game('a'))
    await repo.put(game('b'))
    await repo.remove('a')
    expect((await repo.load()).games.map((g) => g.id)).toEqual(['b'])
    await repo.clear()
    expect((await repo.load()).games).toEqual([])
  })

  it('imports with overwrite or copy, keeping name and seq', async () => {
    await repo.put({ ...game('a'), note: 'local' })
    const summary = await repo.importMany(
      [
        { game: { ...game('a'), note: 'imported' }, onConflict: 'overwrite' },
        { game: { ...game('a'), note: 'copy' }, onConflict: 'copy' },
        { game: game('b') },
      ],
      () => 'new-id',
    )
    expect(summary).toMatchObject({ added: 1, overwritten: 1, copied: 1 })
    const all = (await repo.load()).games
    expect(all.find((g) => g.id === 'a')!.note).toBe('imported')
    expect(all.find((g) => g.id === 'new-id')).toMatchObject({ note: 'copy', name: { seq: 4 } })
  })

  it('rolls back the whole batch on failure', async () => {
    await repo.put(game('a'))
    await expect(
      repo.importMany([{ game: game('b') }, { game: game('a') }], () => 'x'),
    ).rejects.toThrow('已存在')
    expect((await repo.load()).games.map((g) => g.id)).toEqual(['a'])
  })
})
