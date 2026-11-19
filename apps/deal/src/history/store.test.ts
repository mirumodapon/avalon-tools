import { afterEach, describe, expect, it } from 'vitest'
import type { GameRecord } from './records.ts'
import {
  createLocalStore,
  listRecords,
  openIndexedDbStore,
  openRecordStore,
  saveAndPrune,
  setRecordStore,
  type RecordStore,
} from './store.ts'

const rec = (id: string, createdAt: number): GameRecord => ({
  id,
  createdAt,
  playerCount: 5,
  config: ['merlin', 'assassin'],
  assignments: [
    { seat: 1, role: 'merlin' },
    { seat: 2, role: 'assassin' },
  ],
})

let n = 0
const backends: [string, () => Promise<RecordStore>][] = [
  ['IndexedDB', () => openIndexedDbStore(`avalon-deal-test-${n++}`)],
  ['localStorage', async () => createLocalStore()],
]

afterEach(() => setRecordStore(null))

describe.each(backends)('%s record store', (_, open) => {
  it('saves, lists newest first, gets and deletes', async () => {
    const s = await open()
    await s.save(rec('a', 1))
    await s.save(rec('b', 2))
    expect((await s.list()).map((r) => r.id)).toEqual(['b', 'a'])
    expect(await s.get('a')).toEqual(rec('a', 1))
    await s.delete('a')
    expect(await s.get('a')).toBeUndefined()
    await s.clear()
    expect(await s.list()).toEqual([])
  })

  it('prunes the oldest beyond the limit', async () => {
    const s = await open()
    for (let i = 0; i < 7; i++) await s.save(rec(`r${i}`, i))
    expect(await s.prune(5)).toBe(2)
    expect((await s.list()).map((r) => r.id)).toEqual(['r6', 'r5', 'r4', 'r3', 'r2'])
    // lowering the limit removes more right away
    expect(await s.prune(3)).toBe(2)
    expect((await s.list()).map((r) => r.id)).toEqual(['r6', 'r5', 'r4'])
  })
})

describe('saveAndPrune', () => {
  it('keeps only the newest records after each save', async () => {
    setRecordStore(createLocalStore())
    for (let i = 0; i < 6; i++) await saveAndPrune(rec(`r${i}`, i), 3)
    expect((await listRecords()).map((r) => r.id)).toEqual(['r5', 'r4', 'r3'])
  })
})

describe('openRecordStore', () => {
  it('falls back to localStorage without IndexedDB', async () => {
    const idb = globalThis.indexedDB
    // @ts-expect-error simulate a browser without IndexedDB
    delete globalThis.indexedDB
    try {
      const s = await openRecordStore()
      await s.save(rec('x', 1))
      expect(localStorage.getItem('avalon:deal:records')).toContain('"x"')
    } finally {
      globalThis.indexedDB = idb
    }
  })
})
