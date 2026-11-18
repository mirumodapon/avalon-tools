import { DEFAULT_THEME } from '@avalon/theme'
import { describe, expect, it } from 'vitest'
import { STORAGE_NAMESPACE } from '../storage/storage.ts'
import { DEFAULT_SETTINGS, normalizeSettings, SETTINGS_STORE } from './settings.ts'

describe('settings', () => {
  it('normalizes missing fields to defaults', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings({ theme: { accent: 'blue' } }).theme).toEqual({
      ...DEFAULT_THEME,
      accent: 'blue',
    })
  })
  it('matches the key used by the anti-FOUC bootstrap script', () => {
    expect(`${STORAGE_NAMESPACE}:${SETTINGS_STORE.name}`).toBe('avalon-recorder:settings')
  })
})

describe('forced proposal setting', () => {
  it('defaults to auto-approve and keeps the old auto-reject switch choice', () => {
    expect(DEFAULT_SETTINGS.forcedAutoApprove).toBe(true)
    expect(normalizeSettings({ forcedAutoReject: false }).forcedAutoApprove).toBe(false)
    expect(
      normalizeSettings({ forcedAutoApprove: false, forcedAutoReject: true }).forcedAutoApprove,
    ).toBe(false)
  })
})

describe('display defaults', () => {
  it('shows lady uses inline (compact) by default', () => {
    expect(DEFAULT_SETTINGS.display.ladyLayout).toBe('compact')
    expect(normalizeSettings({}).display.ladyLayout).toBe('compact')
  })
})
