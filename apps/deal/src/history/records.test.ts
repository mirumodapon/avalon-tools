import { describe, expect, it } from 'vitest'
import { newestFirst, recordsToPrune, type GameRecord } from './records.ts'

const rec = (id: string, createdAt: number): GameRecord => ({
  id,
  createdAt,
  playerCount: 5,
  config: ['merlin', 'assassin'],
  assignments: [],
})

const records = [rec('c', 300), rec('a', 100), rec('e', 500), rec('b', 200), rec('d', 400)]

describe('records', () => {
  it('lists newest first', () => {
    expect(newestFirst(records).map((r) => r.id)).toEqual(['e', 'd', 'c', 'b', 'a'])
  })

  it('prunes the oldest records beyond the limit', () => {
    expect(recordsToPrune(records, 3).toSorted()).toEqual(['a', 'b'])
  })

  it('prunes nothing within the limit', () => {
    expect(recordsToPrune(records, 5)).toEqual([])
    expect(recordsToPrune(records, 20)).toEqual([])
  })

  it('prunes more when the limit is lowered', () => {
    const twenty = Array.from({ length: 12 }, (_, i) => rec(`r${i}`, i))
    expect(recordsToPrune(twenty, 10).toSorted()).toEqual(['r0', 'r1'])
    expect(recordsToPrune(twenty, 3)).toHaveLength(9)
    expect(recordsToPrune(twenty, 3)).not.toContain('r11')
  })
})
