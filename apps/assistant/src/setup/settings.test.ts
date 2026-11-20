import { describe, expect, it } from 'vitest'
import { normalizeSetup } from './settings.ts'

describe('normalizeSetup', () => {
  it('pads or trims the names to the player count', () => {
    expect(normalizeSetup({ playerCount: 6, names: ['a'] }).names).toEqual([
      'a',
      '',
      '',
      '',
      '',
      '',
    ])
    expect(
      normalizeSetup({ playerCount: 5, names: ['1', '2', '3', '4', '5', '6'] }).names,
    ).toHaveLength(5)
  })

  it('falls back to passing the phone for an unknown vote mode', () => {
    expect(normalizeSetup({ voteMode: 'x' }).voteMode).toBe('pass')
  })

  it('turns the Lady on by default from 7 players', () => {
    expect(normalizeSetup({ playerCount: 5 }).lady).toBe(false)
    expect(normalizeSetup({ playerCount: 7 }).lady).toBe(true)
    expect(normalizeSetup({ playerCount: 7, lady: false }).lady).toBe(false)
  })

  it('keeps a chosen Lady holder seat only when it is at the table', () => {
    expect(normalizeSetup({ playerCount: 7 }).ladyHolderSeat).toBeNull()
    expect(normalizeSetup({ playerCount: 7, ladyHolderSeat: 3 }).ladyHolderSeat).toBe(3)
    expect(normalizeSetup({ playerCount: 7, ladyHolderSeat: 9 }).ladyHolderSeat).toBeNull()
  })
})
