/**
 * Versioned, namespaced localStorage wrapper.
 *
 * Every value is stored as `{ version, data }`. When the stored version is older
 * than the spec's version, migrations run in order (`migrations[v]` upgrades v → v+1).
 * Reads never throw: corrupt or unreadable data falls back to the spec's default.
 * Writes report failure (e.g. quota exceeded) to subscribers instead of throwing.
 */

/** Every key of every tool starts with `avalon:`. */
export const STORAGE_ROOT = 'avalon'

/** Shared by all tools (e.g. the theme). */
export const GLOBAL_SCOPE = 'global'

/** `avalon:<scope>:<name>`; scope is `global` or an app id such as `record`. */
export function storageKey(scope: string, name: string): string {
  return `${STORAGE_ROOT}:${scope}:${name}`
}

export function globalKey(name: string): string {
  return storageKey(GLOBAL_SCOPE, name)
}

/** IndexedDB database of an app: one per app, e.g. `avalon-record`. */
export function appDatabaseName(appId: string): string {
  return `${STORAGE_ROOT}-${appId}`
}

export interface Envelope<T> {
  version: number
  data: T
}

export type Migration = (data: unknown) => unknown

export interface StoreSpec<T> {
  /** Full localStorage key, from `storageKey()` / `globalKey()`. */
  key: string
  version: number
  /** `migrations[n]` converts data at version n to version n + 1. */
  migrations?: Record<number, Migration>
  /** Validates/coerces migrated data. Throwing means "unusable", and the fallback is used. */
  parse: (data: unknown) => T
  fallback: () => T
}

export type StorageErrorKind = 'quota' | 'unavailable' | 'corrupt' | 'unknown'

export interface StorageError {
  kind: StorageErrorKind
  key: string
  message: string
}

type Listener = (error: StorageError) => void
const listeners = new Set<Listener>()

export function onStorageError(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function report(error: StorageError) {
  for (const l of listeners) l(error)
  if (listeners.size === 0) console.warn('[storage]', error)
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function migrate(
  spec: Pick<StoreSpec<unknown>, 'version' | 'migrations'>,
  envelope: Envelope<unknown>,
): unknown {
  let { version, data } = envelope
  if (version > spec.version)
    throw new Error(`資料版本 ${version} 比此版本程式 (${spec.version}) 更新`)
  while (version < spec.version) {
    const step = spec.migrations?.[version]
    if (!step) throw new Error(`缺少版本 ${version} → ${version + 1} 的 migration`)
    data = step(data)
    version += 1
  }
  return data
}

export function readStore<T>(spec: StoreSpec<T>): T {
  const key = spec.key
  const storage = getStorage()
  if (!storage) return spec.fallback()
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch (error) {
    report({ kind: 'unavailable', key, message: String(error) })
    return spec.fallback()
  }
  if (raw === null) return spec.fallback()
  try {
    const parsed = JSON.parse(raw) as unknown
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('version' in parsed) ||
      !('data' in parsed)
    ) {
      throw new Error('格式錯誤')
    }
    const env = parsed as Envelope<unknown>
    const data = spec.parse(migrate(spec, env))
    if (env.version !== spec.version) writeStore(spec, data)
    return data
  } catch (error) {
    report({
      kind: 'corrupt',
      key,
      message: error instanceof Error ? error.message : String(error),
    })
    return spec.fallback()
  }
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22)
  )
}

export function writeStore<T>(spec: StoreSpec<T>, data: T): boolean {
  const key = spec.key
  const storage = getStorage()
  if (!storage) {
    report({ kind: 'unavailable', key, message: '瀏覽器不支援 localStorage' })
    return false
  }
  try {
    const envelope: Envelope<T> = { version: spec.version, data }
    storage.setItem(key, JSON.stringify(envelope))
    return true
  } catch (error) {
    report({
      kind: isQuotaError(error) ? 'quota' : 'unknown',
      key,
      message: isQuotaError(error) ? '儲存空間已滿，請匯出並刪除舊遊戲' : String(error),
    })
    return false
  }
}

export function removeStore(key: string): void {
  try {
    getStorage()?.removeItem(key)
  } catch {
    // ignore
  }
}

/** Keys currently stored under a prefix (e.g. `avalon:record:`). */
export function keysWithPrefix(prefix: string): string[] {
  const storage = getStorage()
  if (!storage) return []
  const keys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i)
    if (k?.startsWith(prefix)) keys.push(k)
  }
  return keys
}

/** Removes every key of one scope (an app id or `global`); other scopes are untouched. */
export function clearNamespace(scope: string): void {
  const storage = getStorage()
  if (!storage) return
  for (const k of keysWithPrefix(`${STORAGE_ROOT}:${scope}:`)) storage.removeItem(k)
}

/**
 * Calls `onChange` when another tab or app changes `key` (the `storage` event never
 * fires in the window that made the change).
 */
export function onStoreChange(key: string, onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (e: StorageEvent) => {
    if (e.key === key || e.key === null) onChange()
  }
  window.addEventListener('storage', listener)
  return () => window.removeEventListener('storage', listener)
}
