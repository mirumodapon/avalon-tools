import type { Game } from '@avalon/core'
import type { GameRepository, ImportItem, ImportSummary, LoadResult } from './repository.ts'

/** In-memory repository for tests. Mirrors the atomic import semantics. */
export class MemoryGameRepository implements GameRepository {
  readonly data = new Map<string, Game>()
  writes = 0

  async load(): Promise<LoadResult> {
    const games = [...this.data.values()].toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    return { games, skipped: [] }
  }
  async put(game: Game) {
    this.writes++
    this.data.set(game.id, structuredClone(game))
  }
  async remove(id: string) {
    this.data.delete(id)
  }
  async existingIds(ids: readonly string[]) {
    return new Set(ids.filter((id) => this.data.has(id)))
  }
  async importMany(items: readonly ImportItem[], newId: () => string): Promise<ImportSummary> {
    const next = new Map(this.data)
    const summary: ImportSummary = { added: 0, overwritten: 0, copied: 0, games: [] }
    for (const { game, onConflict } of items) {
      const clash = next.has(game.id)
      if (clash && !onConflict) throw new Error(`遊戲 ${game.id} 已存在，請選擇覆蓋或另存`)
      const final = clash && onConflict === 'copy' ? { ...game, id: newId() } : game
      next.set(final.id, final)
      summary.games.push(final)
      if (!clash) summary.added++
      else if (onConflict === 'overwrite') summary.overwritten++
      else summary.copied++
    }
    this.data.clear()
    for (const [k, v] of next) this.data.set(k, v)
    return summary
  }
  async clear() {
    this.data.clear()
  }
}
