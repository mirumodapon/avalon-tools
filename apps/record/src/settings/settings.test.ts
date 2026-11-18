import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  readSettings,
  settingStore,
  writeSettings,
} from './settings.ts'

describe('settings', () => {
  it('normalizes missing fields to defaults (the theme is not a record setting)', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings({ theme: { accent: 'blue' } })).toEqual(DEFAULT_SETTINGS)
  })

  it('stores each setting under avalon:record:<field>', () => {
    expect(settingStore('defaultInputMode').key).toBe('avalon:record:defaultInputMode')
    writeSettings({ ...DEFAULT_SETTINGS, viewMode: 'anomaly', roster: ['阿明'] })
    expect(JSON.parse(localStorage.getItem('avalon:record:viewMode')!)).toEqual({
      version: 1,
      data: 'anomaly',
    })
    expect(readSettings()).toEqual({ ...DEFAULT_SETTINGS, viewMode: 'anomaly', roster: ['阿明'] })
    expect(Object.keys(localStorage).filter((k) => !k.startsWith('avalon:record:'))).toEqual([])
  })

  it('only rewrites changed fields', () => {
    writeSettings(DEFAULT_SETTINGS)
    localStorage.removeItem('avalon:record:naming')
    writeSettings({ ...DEFAULT_SETTINGS, viewMode: 'anomaly' }, DEFAULT_SETTINGS)
    expect(localStorage.getItem('avalon:record:naming')).toBeNull()
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
