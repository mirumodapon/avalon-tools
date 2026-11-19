import type { Faction, RoleId } from '@avalon/rules'

/** Which mode made the record. */
export type RecordKind = 'roles' | 'quest' | 'lady'

interface RecordBase {
  id: string
  createdAt: number
}

/** 發角色: every seat's role, saved when dealt so identities can be checked after the game. */
export interface RolesRecord extends RecordBase {
  kind: 'roles'
  playerCount: number
  /** Enabled special roles. */
  config: RoleId[]
  assignments: { seat: number; role: RoleId }[]
}

/** 出任務: how many went and how many fail cards were played (never who played what). */
export interface QuestRecord extends RecordBase {
  kind: 'quest'
  size: number
  fails: number
}

/** 湖中女神: what the inspected player chose to show. */
export interface LadyRecord extends RecordBase {
  kind: 'lady'
  shown: Faction
}

export type GameRecord = RolesRecord | QuestRecord | LadyRecord

/** The history keeps the newest 50 records, across all modes. */
export const MAX_RECORDS = 50

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0

/**
 * Validates a stored record. Records from before the other modes existed have no
 * `kind` and are 發角色 records.
 */
export function normalizeRecord(r: unknown): GameRecord | null {
  if (!isObject(r) || typeof r.id !== 'string' || typeof r.createdAt !== 'number') return null
  const base = { id: r.id, createdAt: r.createdAt }
  const kind = r.kind ?? 'roles'
  if (kind === 'roles' && Array.isArray(r.assignments) && typeof r.playerCount === 'number') {
    return {
      ...base,
      kind,
      playerCount: r.playerCount,
      config: Array.isArray(r.config) ? (r.config as RoleId[]) : [],
      assignments: r.assignments as RolesRecord['assignments'],
    }
  }
  if (kind === 'quest' && isCount(r.size) && isCount(r.fails) && r.fails <= r.size) {
    return { ...base, kind, size: r.size, fails: r.fails }
  }
  if (kind === 'lady' && (r.shown === 'good' || r.shown === 'evil')) {
    return { ...base, kind, shown: r.shown }
  }
  return null
}

/** Normalizes stored records, dropping the ones that cannot be read. */
export function readRecords(rows: readonly unknown[]): GameRecord[] {
  return rows.map(normalizeRecord).filter((r): r is GameRecord => r !== null)
}

/** Newest first; ties keep a stable order by id. */
export function newestFirst<T extends RecordBase>(records: readonly T[]): T[] {
  return records.toSorted((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id))
}

/** Ids of the records beyond the newest `limit`, i.e. the ones to delete. */
export function recordsToPrune(records: readonly RecordBase[], limit: number): string[] {
  return newestFirst(records)
    .slice(Math.max(0, limit))
    .map((r) => r.id)
}
