/**
 * One-time upgrade from 1.9.1 (everything at `/`, keys `avalon-recorder:*`,
 * IndexedDB `avalon-recorder`) to 2.x (`avalon:global:*`, `avalon:record:*`,
 * IndexedDB `avalon-record`).
 *
 * Safe to run any number of times: nothing that already exists in the new place is
 * overwritten, and the 1.x data is never deleted here — it is only marked for cleanup.
 */
import { gamesToJson, parseGame, type Game } from '@avalon/record-core'
import { globalKey, storageKey, writeStore } from '@avalon/storage'
import { normalizeTheme } from '@avalon/theme'
import { THEME_STORE } from '@avalon/ui'
import { Dexie } from 'dexie'
import { AvalonDB, toRecord, type GameRecord } from '../db/dexie.ts'
import { normalizeSettings, SETTING_FIELDS, settingStore } from '../settings/settings.ts'

export const FROM_VERSION = '1.9.1'
/** The release after which the kept 1.x data may be removed. */
export const CLEANUP_AFTER = '2.1.0'

export const LEGACY = {
  settings: 'avalon-recorder:settings',
  session: 'avalon-recorder:session',
  uiPrefix: 'avalon-recorder:ui:',
  database: 'avalon-recorder',
} as const

export const MIGRATED_FLAG = globalKey('migratedFrom')
export const CLEANUP_FLAG = globalKey('legacyCleanupAfter')

export type MigrationResult =
  | { status: 'none' }
  | { status: 'already' }
  | { status: 'migrated'; games: number; skipped: number }
  | { status: 'failed'; error: string }

function legacyKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith('avalon-recorder:')) keys.push(k)
  }
  return keys
}

/** Copies a raw value unless the new key already has one. */
function copyIfAbsent(from: string, to: string): void {
  const value = localStorage.getItem(from)
  if (value !== null && localStorage.getItem(to) === null) localStorage.setItem(to, value)
}

function migrateSettings(): void {
  const raw = localStorage.getItem(LEGACY.settings)
  if (raw === null) return
  let data: Record<string, unknown> = {}
  try {
    data = ((JSON.parse(raw) as { data?: Record<string, unknown> }).data ?? {}) as Record<
      string,
      unknown
    >
  } catch {
    return // unreadable 1.x settings: keep defaults, leave the old value untouched
  }
  if (localStorage.getItem(THEME_STORE.key) === null && data.theme) {
    writeStore(THEME_STORE, normalizeTheme(data.theme))
  }
  // 1.x rules (e.g. forcedAutoReject → forcedAutoApprove) are applied by the same normalizer.
  const settings = normalizeSettings(data)
  for (const field of SETTING_FIELDS) {
    const store = settingStore(field)
    if (localStorage.getItem(store.key) === null) writeStore(store, settings[field])
  }
}

function migrateSessionAndDrafts(): void {
  copyIfAbsent(LEGACY.session, storageKey('record', 'session'))
  for (const key of legacyKeys().filter((k) => k.startsWith(LEGACY.uiPrefix))) {
    copyIfAbsent(key, storageKey('record', `ui:${key.slice(LEGACY.uiPrefix.length)}`))
  }
}

async function legacyRecords(): Promise<GameRecord[] | null> {
  if (!(await Dexie.exists(LEGACY.database))) return null
  const db = new AvalonDB(LEGACY.database)
  try {
    return await db.games.toArray()
  } finally {
    db.close()
  }
}

/** Copies 1.x games that the new database does not have yet; verifies every one arrived. */
async function migrateGames(target: AvalonDB): Promise<{ games: number; skipped: number }> {
  const records = await legacyRecords()
  if (!records) return { games: 0, skipped: 0 }
  const games: Game[] = []
  let skipped = 0
  for (const r of records) {
    const parsed = parseGame(r.game)
    if (parsed.ok) games.push(parsed.game)
    else skipped++ // unreadable in 1.x too; still kept in the old database
  }
  const ids = games.map((g) => g.id)
  const existing = new Set((await target.games.bulkGet(ids)).filter(Boolean).map((r) => r!.id))
  const missing = games.filter((g) => !existing.has(g.id))
  await target.games.bulkPut(missing.map(toRecord))
  const present = (await target.games.bulkGet(ids)).filter(Boolean).length
  if (present !== ids.length) {
    throw new Error(`遊戲筆數不一致：舊資料 ${ids.length} 筆，新資料庫只有 ${present} 筆`)
  }
  return { games: ids.length, skipped }
}

/**
 * The synchronous part (settings, theme, session, drafts). Runs before any store reads
 * localStorage; idempotent and flag-free — the flag is set once the games are verified.
 */
export function migrateLocalFromV1(): void {
  if (localStorage.getItem(MIGRATED_FLAG) !== null || !hasLegacyData()) return
  migrateSettings()
  migrateSessionAndDrafts()
}

export function hasLegacyData(): boolean {
  return legacyKeys().length > 0
}

/** Runs the upgrade. `target` is the 2.x games database (injectable for tests). */
export async function migrateFromV1(target: AvalonDB = new AvalonDB()): Promise<MigrationResult> {
  if (localStorage.getItem(MIGRATED_FLAG) !== null) return { status: 'already' }
  const hasLocal = hasLegacyData()
  const hasDb = await Dexie.exists(LEGACY.database).catch(() => false)
  if (!hasLocal && !hasDb) return { status: 'none' }
  try {
    migrateSettings()
    migrateSessionAndDrafts()
    const counts = await migrateGames(target)
    localStorage.setItem(MIGRATED_FLAG, FROM_VERSION)
    // Old data stays for one release cycle, then may be removed.
    localStorage.setItem(CLEANUP_FLAG, CLEANUP_AFTER)
    return { status: 'migrated', ...counts }
  } catch (e) {
    return { status: 'failed', error: e instanceof Error ? e.message : String(e) }
  }
}

/** JSON backup of the 1.x games (importable in 2.x), for when the upgrade fails. */
export async function exportLegacyBackup(): Promise<string> {
  const records = (await legacyRecords()) ?? []
  return gamesToJson(records.map((r) => r.game))
}
