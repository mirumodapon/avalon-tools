/**
 * Deal history storage. IndexedDB (`avalon-deal`) when it opens, otherwise
 * localStorage (`avalon:deal:records`). The UI only uses the functions exported
 * at the bottom, never the underlying APIs.
 */
import { appDatabaseName, readStore, storageKey, writeStore, type StoreSpec } from '@avalon/storage'
import { Dexie, type Table } from 'dexie'
import {
  newestFirst,
  normalizeRecord,
  readRecords,
  recordsToPrune,
  type GameRecord,
} from './records.ts'

export interface RecordStore {
  save(record: GameRecord): Promise<void>
  /** Newest first. */
  list(): Promise<GameRecord[]>
  get(id: string): Promise<GameRecord | undefined>
  delete(id: string): Promise<void>
  clear(): Promise<void>
  /** Keeps the newest `limit` records; returns how many were deleted. */
  prune(limit: number): Promise<number>
}

export const DB_NAME = appDatabaseName('deal')

class DealDB extends Dexie {
  records!: Table<GameRecord, string>
  constructor(name: string) {
    super(name)
    this.version(1).stores({ records: 'id, createdAt' })
  }
}

export async function openIndexedDbStore(name = DB_NAME): Promise<RecordStore> {
  const db = new DealDB(name)
  await db.open()
  return {
    save: async (r) => void (await db.records.put(r)),
    list: async () => newestFirst(readRecords(await db.records.toArray())),
    get: async (id) => normalizeRecord(await db.records.get(id)) ?? undefined,
    delete: (id) => db.records.delete(id),
    clear: () => db.records.clear(),
    prune: async (limit) => {
      const ids = recordsToPrune(await db.records.toArray(), limit)
      await db.records.bulkDelete(ids)
      return ids.length
    },
  }
}

export const RECORDS_STORE: StoreSpec<GameRecord[]> = {
  key: storageKey('deal', 'records'),
  version: 1,
  parse: (data) => (Array.isArray(data) ? readRecords(data) : []),
  fallback: () => [],
}

const all = () => readStore(RECORDS_STORE)
const put = (records: GameRecord[]) => {
  if (!writeStore(RECORDS_STORE, records)) throw new Error('無法寫入歷史紀錄')
}

export function createLocalStore(): RecordStore {
  return {
    save: async (r) => put([...all().filter((x) => x.id !== r.id), r]),
    list: async () => newestFirst(all()),
    get: async (id) => all().find((r) => r.id === id),
    delete: async (id) => put(all().filter((r) => r.id !== id)),
    clear: async () => put([]),
    prune: async (limit) => {
      const ids = new Set(recordsToPrune(all(), limit))
      if (ids.size) put(all().filter((r) => !ids.has(r.id)))
      return ids.size
    },
  }
}

/** IndexedDB, or localStorage when it is missing or fails to open. */
export async function openRecordStore(): Promise<RecordStore> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('no IndexedDB')
    return await openIndexedDbStore()
  } catch {
    return createLocalStore()
  }
}

let current: Promise<RecordStore> | null = null
const store = () => (current ??= openRecordStore())

/** Tests swap the backing store. */
export function setRecordStore(next: RecordStore | null): void {
  current = next ? Promise.resolve(next) : null
}

export const saveRecord = async (r: GameRecord) => (await store()).save(r)
export const listRecords = async () => (await store()).list()
export const getRecord = async (id: string) => (await store()).get(id)
export const deleteRecord = async (id: string) => (await store()).delete(id)
export const clearRecords = async () => (await store()).clear()
export const pruneRecords = async (limit: number) => (await store()).prune(limit)

/** Saves a new deal and drops the oldest records beyond `limit`. */
export async function saveAndPrune(record: GameRecord, limit: number): Promise<void> {
  await saveRecord(record)
  await pruneRecords(limit)
}
