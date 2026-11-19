import type { RoleId } from '@avalon/rules'

/** One deal, saved when it is made so identities can be checked after the game. */
export interface GameRecord {
  id: string
  createdAt: number
  playerCount: number
  /** Enabled special roles. */
  config: RoleId[]
  assignments: { seat: number; role: RoleId }[]
}

export const KEEP_OPTIONS = [3, 5, 10, 20] as const
export type KeepCount = (typeof KEEP_OPTIONS)[number]
export const DEFAULT_KEEP: KeepCount = 5

/** Newest first; ties keep a stable order by id. */
export function newestFirst(records: readonly GameRecord[]): GameRecord[] {
  return records.toSorted((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id))
}

/** Ids of the records beyond the newest `limit`, i.e. the ones to delete. */
export function recordsToPrune(records: readonly GameRecord[], limit: number): string[] {
  return newestFirst(records)
    .slice(Math.max(0, limit))
    .map((r) => r.id)
}
