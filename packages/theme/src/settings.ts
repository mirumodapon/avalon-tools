import type { AccentName } from './palette.ts'
import { ACCENT_NAMES, DARK_FLAVOR, hexOf, LIGHT_FLAVOR, type AppFlavor } from './palette.ts'

/** `system` follows the OS; light is Latte, dark is Macchiato. */
export type ThemeMode = 'system' | 'light' | 'dark'

export const THEME_MODES = ['system', 'light', 'dark'] as const satisfies readonly ThemeMode[]

export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  system: '系統',
  light: '淺色',
  dark: '深色',
}

export interface ThemeSettings {
  mode: ThemeMode
  accent: AccentName
}

export const DEFAULT_THEME: ThemeSettings = {
  mode: 'system',
  accent: 'mauve',
}

export function resolveFlavor(theme: ThemeSettings, prefersDark: boolean): AppFlavor {
  const dark = theme.mode === 'system' ? prefersDark : theme.mode === 'dark'
  return dark ? DARK_FLAVOR : LIGHT_FLAVOR
}

/** Maps legacy `flavor` values (catppuccin flavor names) to a mode. */
function legacyMode(flavor: unknown): ThemeMode | null {
  if (flavor === 'system') return 'system'
  if (flavor === 'latte') return 'light'
  if (flavor === 'frappe' || flavor === 'macchiato' || flavor === 'mocha') return 'dark'
  return null
}

/** Coerces an unknown value into valid theme settings, falling back to defaults per field. */
export function normalizeTheme(value: unknown): ThemeSettings {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const mode = THEME_MODES.includes(v.mode as ThemeMode)
    ? (v.mode as ThemeMode)
    : (legacyMode(v.flavor) ?? DEFAULT_THEME.mode)
  const accent = ACCENT_NAMES.includes(v.accent as AccentName)
    ? (v.accent as AccentName)
    : DEFAULT_THEME.accent
  return { mode, accent }
}

export function themeColorOf(flavor: AppFlavor): string {
  return hexOf(flavor, 'base')
}

export const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)'

/** Applies the theme to `<html>` and `<meta name="theme-color">`. */
export function applyTheme(theme: ThemeSettings, doc: Document = document): AppFlavor {
  const prefersDark = doc.defaultView?.matchMedia?.(PREFERS_DARK_QUERY).matches ?? false
  const flavor = resolveFlavor(theme, prefersDark)
  const root = doc.documentElement
  root.dataset.flavor = flavor
  root.dataset.accent = theme.accent
  let meta = doc.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = doc.createElement('meta')
    meta.name = 'theme-color'
    doc.head.append(meta)
  }
  meta.content = themeColorOf(flavor)
  return flavor
}
