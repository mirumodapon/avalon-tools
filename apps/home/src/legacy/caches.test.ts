import { describe, expect, it } from 'vitest'
import { clearLegacyCaches, legacyCacheName } from './caches.ts'

describe('clearLegacyCaches', () => {
  it('deletes only the 1.x precache at the site root', async () => {
    const names = new Set([
      legacyCacheName(window.location.origin),
      'avalon-record-precache-v2-x/record/',
    ])
    const fake = {
      delete: (n: string) => Promise.resolve(names.delete(n)),
    } as unknown as CacheStorage
    expect(await clearLegacyCaches(fake)).toBe(true)
    expect([...names]).toEqual(['avalon-record-precache-v2-x/record/'])
  })

  it('copes without the Cache API', async () => {
    expect(await clearLegacyCaches(undefined)).toBe(false)
  })
})
