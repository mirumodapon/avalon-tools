import { makePlayers } from '@avalon/record-core'
import { describe, expect, it } from 'vitest'
import { seatLabel } from './seat.ts'

describe('seatLabel', () => {
  const game = { players: makePlayers(['小明', '', '  ', '4號', '小明']) }

  it('shows the seat and the name', () => {
    expect(seatLabel(game, 'p1')).toBe('1 號・小明')
  })

  it('shows only the seat when no name was given', () => {
    expect(seatLabel(game, 'p2')).toBe('2 號')
    expect(seatLabel(game, 'p3')).toBe('3 號')
    expect(seatLabel(game, 'p4')).toBe('4 號')
  })

  it('tells players with the same name apart by seat', () => {
    expect(seatLabel(game, 'p5')).toBe('5 號・小明')
  })
})
