import { describe, expect, it } from 'vitest'
import { nextEmptySeat, resizeSeats, tapRosterName } from './seats.ts'

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

  it('fills the active seat and advances', () => {
    let s = { names: ['', '', ''], active: 0 }
    s = tapRosterName(s.names, s.active, '阿明')
    expect(s).toEqual({ names: ['阿明', '', ''], active: 1 })
    s = tapRosterName(s.names, s.active, '小華')
    s = tapRosterName(s.names, s.active, '小美')
    expect(s).toEqual({ names: ['阿明', '小華', '小美'], active: -1 })
  })

  it('removes a seated name when tapped again', () => {
    expect(tapRosterName(['阿明', '小華'], -1, '阿明')).toEqual({ names: ['', '小華'], active: 0 })
  })

  it('overwrites the active seat even if filled', () => {
    expect(tapRosterName(['阿明', '小華', ''], 0, '小美')).toEqual({
      names: ['小美', '小華', ''],
      active: 2,
    })
  })

  it('does nothing when every seat is filled and none is active', () => {
    expect(tapRosterName(['a', 'b'], -1, 'c')).toEqual({ names: ['a', 'b'], active: -1 })
  })
})
