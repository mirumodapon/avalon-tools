import { describe, expect, it } from 'vitest'
import { nextEmptySeat, resizeSeats, seatPicked } from './seats.ts'

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

  it('seats picks first and keeps the rest', () => {
    expect(seatPicked(['', '', '', '', ''], ['阿明', '小華'], 5)).toEqual([
      '阿明',
      '小華',
      '',
      '',
      '',
    ])
    expect(seatPicked(['a', 'b', 'c', 'd', 'e'], ['x'], 5)).toEqual(['x', 'b', 'c', 'd', 'e'])
    // a picked name is removed from its old seat
    expect(seatPicked(['a', 'b', 'x', 'd', 'e'], ['x'], 5)).toEqual(['x', 'b', '', 'd', 'e'])
    // growing the table
    expect(seatPicked(['a', 'b', 'c', 'd', 'e'], ['1', '2', '3', '4', '5', '6'], 6)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ])
  })
})
