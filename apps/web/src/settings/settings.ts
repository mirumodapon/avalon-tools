import { DEFAULT_THEME, normalizeTheme, type ThemeSettings } from '@avalon/theme'
import type { StoreSpec } from '../storage/storage.ts'

export interface Settings {
  theme: ThemeSettings
}

export const DEFAULT_SETTINGS: Settings = {
  theme: DEFAULT_THEME,
}

/** Coerces stored settings, filling missing/invalid fields with defaults. */
export function normalizeSettings(value: unknown): Settings {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  return {
    theme: normalizeTheme(v.theme),
  }
}

export const SETTINGS_STORE: StoreSpec<Settings> = {
  name: 'settings',
  version: 1,
  parse: normalizeSettings,
  fallback: () => DEFAULT_SETTINGS,
}
