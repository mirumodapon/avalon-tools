import type { Game } from '@avalon/core'

export type ConflictChoice = 'overwrite' | 'copy'

export interface ImportItem {
  game: Game
  /** Required when a game with the same id already exists. */
  onConflict?: ConflictChoice
}

export interface ImportSummary {
  added: number
  overwritten: number
  copied: number
  /** Final games as stored (copies carry their new ids). */
  games: Game[]
}

export interface LoadResult {
  games: Game[]
  /** Records that could not be migrated/validated and were skipped. */
  skipped: { id: string; error: string }[]
}

/**
 * Storage boundary for games. The UI only talks to this interface, never to Dexie,
 * so it can be swapped (e.g. an in-memory fake in tests).
 */
export interface GameRepository {
  /** All games, newest first. */
  load(): Promise<LoadResult>
  put(game: Game): Promise<void>
  remove(id: string): Promise<void>
  /** Returns which of the given ids already exist. */
  existingIds(ids: readonly string[]): Promise<Set<string>>
  /** Imports atomically: either every game is written or none is. */
  importMany(items: readonly ImportItem[], newId: () => string): Promise<ImportSummary>
  clear(): Promise<void>
}
