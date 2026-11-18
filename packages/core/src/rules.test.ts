import { describe, expect, it } from 'vitest'
import {
  factionCounts,
  failsRequired,
  isForcedAttempt,
  isMajority,
  questSucceeded,
  teamSize,
  teamSizes,
} from './rules.ts'

describe('teamSize', () => {
  it.each([
    [5, [2, 3, 2, 3, 3]],
    [6, [2, 3, 4, 3, 4]],
    [7, [2, 3, 3, 4, 4]],
    [8, [3, 4, 4, 5, 5]],
    [9, [3, 4, 4, 5, 5]],
    [10, [3, 4, 4, 5, 5]],
  ])('%i players', (n, sizes) => {
    expect(teamSizes(n)).toEqual(sizes)
    sizes.forEach((s, q) => expect(teamSize(n, q)).toBe(s))
  })

  it('rejects unsupported counts and quests', () => {
    expect(() => teamSize(4, 0)).toThrow(RangeError)
    expect(() => teamSize(11, 0)).toThrow(RangeError)
    expect(() => teamSize(5, 5)).toThrow(RangeError)
    expect(() => teamSize(5, -1)).toThrow(RangeError)
  })
})

describe('factionCounts', () => {
  it.each([
    [5, 3, 2],
    [6, 4, 2],
    [7, 4, 3],
    [8, 5, 3],
    [9, 6, 3],
    [10, 6, 4],
  ])('%i players → %i:%i', (n, good, evil) => {
    expect(factionCounts(n)).toEqual({ good, evil })
    expect(good + evil).toBe(n)
  })
})

describe('isMajority', () => {
  it('requires strictly more than half', () => {
    expect(isMajority(3, 5)).toBe(true)
    expect(isMajority(2, 5)).toBe(false)
    expect(isMajority(3, 6)).toBe(false)
    expect(isMajority(4, 6)).toBe(true)
    expect(isMajority(5, 10)).toBe(false)
    expect(isMajority(6, 10)).toBe(true)
  })
})

describe('two-fail rule', () => {
  it('needs 2 fails only on quest 4 with 7+ players', () => {
    for (const n of [5, 6]) expect(failsRequired(n, 3)).toBe(1)
    for (const n of [7, 8, 9, 10]) {
      expect(failsRequired(n, 3)).toBe(2)
      for (const q of [0, 1, 2, 4]) expect(failsRequired(n, q)).toBe(1)
    }
  })
  it('judges quest outcomes', () => {
    expect(questSucceeded(7, 3, 1)).toBe(true)
    expect(questSucceeded(7, 3, 2)).toBe(false)
    expect(questSucceeded(6, 3, 1)).toBe(false)
    expect(questSucceeded(5, 0, 0)).toBe(true)
  })
})

describe('isForcedAttempt', () => {
  it('is the 5th proposal', () => {
    expect(isForcedAttempt(4)).toBe(false)
    expect(isForcedAttempt(5)).toBe(true)
  })
})
