import type { InputMode, ViewMode } from '@avalon/core'
import { DEFAULT_THEME, normalizeTheme, type ThemeSettings } from '@avalon/theme'
import type { StoreSpec } from '../storage/storage.ts'
import { normalizeRoster } from './roster.ts'

export interface Settings {
  theme: ThemeSettings
  /** Input mode preselected on every new proposal. */
  defaultInputMode: InputMode
  /** Fill the forced (5th) proposal with all-reject votes and skip vote entry. */
  forcedAutoReject: boolean
  /** Saved player names for quick seat filling. */
  roster: string[]
  /** How votes are displayed; the toggle on every history view updates this. */
  viewMode: ViewMode
}

export const DEFAULT_SETTINGS: Settings = {
  theme: DEFAULT_THEME,
  defaultInputMode: 'approvals',
  forcedAutoReject: true,
  roster: [],
  viewMode: 'full',
}

function pick<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/** Coerces stored settings, filling missing/invalid fields with defaults. */
export function normalizeSettings(value: unknown): Settings {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const d = DEFAULT_SETTINGS
  return {
    theme: normalizeTheme(v.theme),
    defaultInputMode: pick(v.defaultInputMode, ['approvals', 'anomalies'], d.defaultInputMode),
    forcedAutoReject: bool(v.forcedAutoReject, d.forcedAutoReject),
    roster: normalizeRoster(v.roster),
    viewMode: pick(v.viewMode, ['full', 'anomaly'], d.viewMode),
  }
}

export const SETTINGS_STORE: StoreSpec<Settings> = {
  name: 'settings',
  version: 1,
  parse: normalizeSettings,
  fallback: () => DEFAULT_SETTINGS,
}
