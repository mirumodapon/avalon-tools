import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, normalizeSettings, SETTINGS_STORE, useSettings } from './settings.ts'

describe('settings', () => {
  it('defaults to 5 players with Merlin + Assassin', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      playerCount: 5,
      special: ['merlin', 'assassin'],
      recordView: 'seat',
      tab: 'roles',
    })
  })

  it('repairs stored garbage and drops the old keep setting', () => {
    expect(
      normalizeSettings({ playerCount: 11, special: ['merlin', 'loyal', 'x'], keep: 7 }),
    ).toEqual({
      playerCount: 5,
      special: ['merlin'],
      recordView: 'seat',
      tab: 'roles',
    })
  })

  it('persists updates to localStorage', () => {
    useSettings.getState().update({ playerCount: 8 })
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORE.key)!)).toEqual({
      version: 1,
      data: { playerCount: 8, special: ['merlin', 'assassin'], recordView: 'seat', tab: 'roles' },
    })
  })
})
