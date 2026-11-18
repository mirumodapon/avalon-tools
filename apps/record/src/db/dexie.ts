import { dateKey, deriveState, parseGame, type Game } from '@avalon/record-core'
import { Dexie, type Table } from 'dexie'
import type { GameRepository, ImportItem, ImportSummary, LoadResult } from './repository.ts'

/** One row per game. Indexed fields are derived from `game` on every write. */
export interface GameRecord {
  id: string
  createdAt: string
  /** Local `YYYY-MM-DD` of `createdAt`, for date filters and `{seq}`. */
  date: string
  /** `good`, `evil`, or `none` while unfinished (IndexedDB cannot index null). */
  winner: 'good' | 'evil' | 'none'
  updatedAt: string
  /** Our own data schema version, independent of Dexie's version. */
  schemaVersion: number
  game: Game
}

export const DB_NAME = 'avalon-recorder'

export class AvalonDB extends Dexie {
  games!: Table<GameRecord, string>

  constructor(name = DB_NAME) {
    super(name)
    // Dexie schema version: bump (and add an .upgrade()) when indexes change.
    this.version(1).stores({ games: 'id, createdAt, date, winner, updatedAt' })
  }
}

export function toRecord(game: Game): GameRecord {
  return {
    id: game.id,
    createdAt: game.createdAt,
    date: dateKey(new Date(game.createdAt)),
    winner: deriveState(game).winner ?? 'none',
    updatedAt: game.updatedAt,
    schemaVersion: game.schemaVersion,
    game,
  }
}

export class DexieGameRepository implements GameRepository {
  constructor(private readonly db: AvalonDB = new AvalonDB()) {}

  async load(): Promise<LoadResult> {
    // Dexie Collection#reverse (query order), not Array#reverse.
    // oxlint-disable-next-line unicorn/no-array-reverse
    const records = await this.db.games.orderBy('createdAt').reverse().toArray()
    const games: Game[] = []
    const skipped: LoadResult['skipped'] = []
    const upgraded: GameRecord[] = []
    for (const r of records) {
      const parsed = parseGame(r.game)
      if (!parsed.ok) {
        skipped.push({ id: r.id, error: parsed.error })
        continue
      }
      games.push(parsed.game)
      if (r.schemaVersion !== parsed.game.schemaVersion) upgraded.push(toRecord(parsed.game))
    }
    if (upgraded.length) await this.db.games.bulkPut(upgraded)
    return { games, skipped }
  }

  async put(game: Game): Promise<void> {
    await this.db.games.put(toRecord(game))
  }

  async remove(id: string): Promise<void> {
    await this.db.games.delete(id)
  }

  async existingIds(ids: readonly string[]): Promise<Set<string>> {
    const keys = await this.db.games
      .where('id')
      .anyOf([...ids])
      .primaryKeys()
    return new Set(keys)
  }

  async importMany(items: readonly ImportItem[], newId: () => string): Promise<ImportSummary> {
    return this.db.transaction('rw', this.db.games, async () => {
      const summary: ImportSummary = { added: 0, overwritten: 0, copied: 0, games: [] }
      const existing = await this.existingIds(items.map((i) => i.game.id))
      const seen = new Set<string>()
      for (const { game, onConflict } of items) {
        const clash = existing.has(game.id) || seen.has(game.id)
        if (clash && !onConflict) throw new Error(`遊戲 ${game.id} 已存在，請選擇覆蓋或另存`)
        // Imported games keep their original name and {seq}; a copy only gets a new id.
        const final = clash && onConflict === 'copy' ? { ...game, id: newId() } : game
        await this.db.games.put(toRecord(final))
        seen.add(final.id)
        summary.games.push(final)
        if (!clash) summary.added++
        else if (onConflict === 'overwrite') summary.overwritten++
        else summary.copied++
      }
      return summary
    })
  }

  async clear(): Promise<void> {
    await this.db.games.clear()
  }
}
