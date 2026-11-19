import { afterEach, describe, expect, it, vi } from 'vitest'
import { dealRoles, secureRandomInt, shuffle } from './shuffle.ts'

afterEach(() => vi.restoreAllMocks())

describe('secureRandomInt', () => {
  it('stays in range', () => {
    for (let i = 0; i < 500; i++) {
      const n = secureRandomInt(7)
      expect(n >= 0 && n < 7 && Number.isInteger(n)).toBe(true)
    }
  })

  it('rejects values that would bias the result', () => {
    const values = [2 ** 32 - 1, 5]
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((buf) => {
      ;(buf as Uint32Array)[0] = values.shift()!
      return buf
    })
    // 2^32 - 1 is above the largest multiple of 10, so it is drawn again
    expect(secureRandomInt(10)).toBe(5)
  })
})

describe('shuffle', () => {
  it('is a permutation and leaves the input alone', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const out = shuffle(input)
    expect(out.toSorted((a, b) => a - b)).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('follows Fisher–Yates with the given random source', () => {
    // always pick index 0: each element swaps with the front in turn
    expect(shuffle(['a', 'b', 'c', 'd'], () => 0)).toEqual(['b', 'c', 'd', 'a'])
  })

  it('reaches every ordering of three items', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 300; i++) seen.add(shuffle(['a', 'b', 'c']).join(''))
    expect(seen.size).toBe(6)
  })
})

describe('dealRoles', () => {
  it('gives seats 1..n one role each', () => {
    const dealt = dealRoles(['merlin', 'assassin', 'loyal', 'loyal', 'minion'])
    expect(dealt.map((d) => d.seat)).toEqual([1, 2, 3, 4, 5])
    expect(dealt.map((d) => d.role).toSorted()).toEqual([
      'assassin',
      'loyal',
      'loyal',
      'merlin',
      'minion',
    ])
  })
})
