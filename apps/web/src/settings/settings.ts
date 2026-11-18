import { DEFAULT_NAMING, type InputMode, type NamingTemplate, type ViewMode } from '@avalon/core'
import { DEFAULT_THEME, normalizeTheme, type ThemeSettings } from '@avalon/theme'
import type { StoreSpec } from '../storage/storage.ts'
import { normalizeRoster } from './roster.ts'

export type Detail = 'simple' | 'detailed'

export interface DisplayOptions {
  /** Quest result: colored chip with fail count, or full text. */
  questResult: Detail
  /** Lady of the Lake: `seat → seat: faction icon`, or names with declaration/truth. */
  ladyResult: Detail
  /** Lady uses inline after each quest (compact), or as one chain above the quests (separate). */
  ladyLayout: 'compact' | 'separate'
}

export interface Settings {
  theme: ThemeSettings
  /** Input mode for a game's first proposal; follows the mode last used to record. */
  defaultInputMode: InputMode
  /** Fill the forced (5th) proposal with all-approve votes and skip vote entry. */
  forcedAutoApprove: boolean
  /** Saved player names for quick seat filling. */
  roster: string[]
  /** Template for games without a custom name. */
  naming: NamingTemplate
  /** How votes are displayed; the toggle on every history view updates this. */
  viewMode: ViewMode
  /** Show roles/factions when browsing history (in-progress games always start hidden). */
  showRoles: boolean
  display: DisplayOptions
}

export const DEFAULT_SETTINGS: Settings = {
  theme: DEFAULT_THEME,
  defaultInputMode: 'approvals',
  forcedAutoApprove: true,
  roster: [],
  naming: DEFAULT_NAMING,
  viewMode: 'full',
  showRoles: false,
  display: { questResult: 'simple', ladyResult: 'simple', ladyLayout: 'compact' },
}

function pick<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeNaming(value: unknown): NamingTemplate {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const template =
    typeof v.template === 'string' && v.template.trim() ? v.template : DEFAULT_NAMING.template
  const dateFormat =
    typeof v.dateFormat === 'string' && v.dateFormat.trim()
      ? v.dateFormat
      : DEFAULT_NAMING.dateFormat
  return { template, dateFormat }
}

function normalizeDisplay(value: unknown): DisplayOptions {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const d = DEFAULT_SETTINGS.display
  const details = ['simple', 'detailed'] as const
  return {
    questResult: pick(v.questResult, details, d.questResult),
    ladyResult: pick(v.ladyResult, details, d.ladyResult),
    ladyLayout: pick(v.ladyLayout, ['compact', 'separate'] as const, d.ladyLayout),
  }
}

/** Coerces stored settings, filling missing/invalid fields with defaults. */
export function normalizeSettings(value: unknown): Settings {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const d = DEFAULT_SETTINGS
  return {
    theme: normalizeTheme(v.theme),
    defaultInputMode: pick(v.defaultInputMode, ['approvals', 'anomalies'], d.defaultInputMode),
    // `forcedAutoReject` is the old name of this switch; keep the user's on/off choice.
    forcedAutoApprove: bool(v.forcedAutoApprove, bool(v.forcedAutoReject, d.forcedAutoApprove)),
    roster: normalizeRoster(v.roster),
    naming: normalizeNaming(v.naming),
    viewMode: pick(v.viewMode, ['full', 'anomaly'], d.viewMode),
    showRoles: bool(v.showRoles, d.showRoles),
    display: normalizeDisplay(v.display),
  }
}

export const SETTINGS_STORE: StoreSpec<Settings> = {
  name: 'settings',
  version: 1,
  parse: normalizeSettings,
  fallback: () => DEFAULT_SETTINGS,
}
