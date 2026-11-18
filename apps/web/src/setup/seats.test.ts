import { describe, expect, it } from 'vitest'
import { nextEmptySeat, resizeSeats } from './seats.ts'

describe('seats', () => {
  it('resizes keeping existing names', () => {
    expect(resizeSeats(['a', 'b'], 3)).toEqual(['a', 'b', ''])
    expect(resizeSeats(['a', 'b', 'c'], 2)).toEqual(['a', 'b'])
  })

  it('finds the next empty seat with wrap-around', () => {
    expect(nextEmptySeat(['a', '', 'c', ''], 2)).toBe(3)
    expect(nextEmptySeat(['', 'b', 'c'], 1)).toBe(0)
    expect(nextEmptySeat(['a', 'b'])).toBe(-1)
  })
})
