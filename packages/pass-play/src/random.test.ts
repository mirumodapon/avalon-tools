import { describe, expect, it } from 'vitest'
import { newId, randomUint32 } from './random.ts'

/** A browser with getRandomValues but no randomUUID (iOS 11–15.3). */
const onlyRandomValues = {
  getRandomValues: (b: Uint32Array) => {
    b[0] = Math.floor(Math.random() * 2 ** 32)
    return b
  },
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('random on old browsers', () => {
  it('makes v4 ids without crypto.randomUUID', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newId(onlyRandomValues)))
    expect(ids.size).toBe(50)
    for (const id of ids) expect(id).toMatch(UUID)
  })

  it('works with no Web Crypto at all', () => {
    expect(newId(undefined)).toMatch(UUID)
    const n = randomUint32(undefined)
    expect(Number.isInteger(n) && n >= 0 && n < 2 ** 32).toBe(true)
  })

  it('survives a crypto that throws', () => {
    const broken = {
      randomUUID: () => {
        throw new Error('insecure context')
      },
      getRandomValues: () => {
        throw new Error('nope')
      },
    }
    expect(newId(broken)).toMatch(UUID)
  })

  it('uses randomUUID when the browser has it', () => {
    expect(newId({ randomUUID: () => 'from-browser' })).toBe('from-browser')
  })
})
