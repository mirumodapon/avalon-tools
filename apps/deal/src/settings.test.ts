import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, normalizeSettings, SETTINGS_STORE, useSettings } from './settings.ts'

describe('settings', () => {
  it('defaults to 5 players, Merlin + Assassin, keep 5', () => {
    expect(DEFAULT_SETTINGS).toEqual({ playerCount: 5, special: ['merlin', 'assassin'], keep: 5 })
  })

  it('repairs stored garbage', () => {
    expect(
      normalizeSettings({ playerCount: 11, special: ['merlin', 'loyal', 'x'], keep: 7 }),
    ).toEqual({
      playerCount: 5,
      special: ['merlin'],
      keep: 5,
    })
  })

  it('persists updates to localStorage', () => {
    useSettings.getState().update({ playerCount: 8, keep: 10 })
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORE.key)!)).toEqual({
      version: 1,
      data: { playerCount: 8, special: ['merlin', 'assassin'], keep: 10 },
    })
  })
})
