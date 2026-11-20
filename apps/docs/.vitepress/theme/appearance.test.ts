import { THEME_STORE } from '@avalon/ui/theme-store'
import { describe, expect, it } from 'vitest'
import {
  appearanceBootstrapScript,
  appearanceOf,
  modeOf,
  VP_APPEARANCE_KEY,
  writeBackMode,
} from './appearance.ts'

function memory(init: Record<string, string> = {}) {
  const data = new Map(Object.entries(init))
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  }
}

const KEY = THEME_STORE.key
const stored = (data: unknown) => JSON.stringify({ version: THEME_STORE.version, data })

describe('docs appearance ↔ shared theme', () => {
  it('uses the tools’ theme key', () => {
    expect(KEY).toBe('avalon:global:theme')
  })

  it('maps modes both ways', () => {
    expect(appearanceOf('system')).toBe('auto')
    expect(appearanceOf('dark')).toBe('dark')
    expect(modeOf('auto')).toBe('system')
    expect(modeOf('light')).toBe('light')
    expect(modeOf(null)).toBe('system')
  })

  it('copies the shared mode into VitePress’s key before it checks dark mode', () => {
    const storage = memory({ [KEY]: stored({ mode: 'dark', accent: 'peach' }) })
    new Function('localStorage', appearanceBootstrapScript(KEY))(storage)
    expect(storage.data.get(VP_APPEARANCE_KEY)).toBe('dark')
  })

  it('leaves VitePress alone when no tool has stored a theme', () => {
    const storage = memory()
    new Function('localStorage', appearanceBootstrapScript(KEY))(storage)
    expect(storage.data.has(VP_APPEARANCE_KEY)).toBe(false)
  })

  it('writes a toggle back, keeping the accent', () => {
    const storage = memory({
      [KEY]: stored({ mode: 'system', accent: 'peach' }),
      [VP_APPEARANCE_KEY]: 'light',
    })
    writeBackMode(storage, KEY, THEME_STORE.version)
    expect(JSON.parse(storage.data.get(KEY)!)).toEqual({
      version: 1,
      data: { mode: 'light', accent: 'peach' },
    })
  })

  it('does not rewrite an unchanged theme', () => {
    const value = stored({ mode: 'dark', accent: 'green' })
    const storage = memory({ [KEY]: value, [VP_APPEARANCE_KEY]: 'dark' })
    writeBackMode(storage, KEY, THEME_STORE.version)
    expect(storage.data.get(KEY)).toBe(value)
  })
})
