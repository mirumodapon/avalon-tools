import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearNamespace,
  onStorageError,
  readStore,
  storageKey,
  writeStore,
  type StorageError,
  type StoreSpec,
} from './storage.ts'

interface V2 {
  count: number
  label: string
}

const spec: StoreSpec<V2> = {
  name: 'test',
  version: 2,
  migrations: {
    1: (d) => ({ count: (d as { n: number }).n, label: 'migrated' }),
  },
  parse: (d) => {
    const v = d as V2
    if (typeof v.count !== 'number') throw new Error('bad')
    return v
  },
  fallback: () => ({ count: 0, label: 'default' }),
}

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('namespaces keys', () => {
    expect(storageKey('x')).toBe('avalon-recorder:x')
  })

  it('returns fallback when empty', () => {
    expect(readStore(spec)).toEqual({ count: 0, label: 'default' })
  })

  it('writes and reads an envelope', () => {
    writeStore(spec, { count: 3, label: 'a' })
    expect(JSON.parse(localStorage.getItem('avalon-recorder:test')!)).toEqual({
      version: 2,
      data: { count: 3, label: 'a' },
    })
    expect(readStore(spec)).toEqual({ count: 3, label: 'a' })
  })

  it('migrates old versions and rewrites them', () => {
    localStorage.setItem('avalon-recorder:test', JSON.stringify({ version: 1, data: { n: 7 } }))
    expect(readStore(spec)).toEqual({ count: 7, label: 'migrated' })
    expect(JSON.parse(localStorage.getItem('avalon-recorder:test')!).version).toBe(2)
  })

  it('reports corrupt data and falls back', () => {
    const listener = vi.fn<(e: StorageError) => void>()
    const off = onStorageError(listener)
    localStorage.setItem('avalon-recorder:test', '{nope')
    expect(readStore(spec).label).toBe('default')
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ kind: 'corrupt' }))
    off()
  })

  it('reports write failures instead of throwing', () => {
    const listener = vi.fn<(e: StorageError) => void>()
    const off = onStorageError(listener)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(writeStore(spec, { count: 1, label: 'x' })).toBe(false)
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ kind: 'quota' }))
    spy.mockRestore()
    off()
  })

  it('clears only the namespace', () => {
    localStorage.setItem('other', '1')
    writeStore(spec, { count: 1, label: 'x' })
    clearNamespace()
    expect(localStorage.getItem('other')).toBe('1')
    expect(localStorage.length).toBe(1)
  })
})
