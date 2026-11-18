import type { AccentName, FlavorName } from './palette.ts'
import { ACCENT_NAMES, FLAVOR_NAMES, hexOf } from './palette.ts'

export type FlavorPreference = 'system' | FlavorName

/** Flavors used when following the OS color scheme. */
export const SYSTEM_LIGHT_FLAVOR: FlavorName = 'latte'
export const SYSTEM_DARK_FLAVOR: FlavorName = 'macchiato'

export interface ThemeSettings {
  /** `system` resolves to Latte (light) or Macchiato (dark). */
  flavor: FlavorPreference
  accent: AccentName
}

export const DEFAULT_THEME: ThemeSettings = {
  flavor: 'system',
  accent: 'mauve',
}

export function resolveFlavor(theme: ThemeSettings, prefersDark: boolean): FlavorName {
  if (theme.flavor !== 'system') return theme.flavor
  return prefersDark ? SYSTEM_DARK_FLAVOR : SYSTEM_LIGHT_FLAVOR
}

/** Coerces an unknown value into valid theme settings, falling back to defaults per field. */
export function normalizeTheme(value: unknown): ThemeSettings {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const flavor =
    v.flavor === 'system' || FLAVOR_NAMES.includes(v.flavor as FlavorName)
      ? (v.flavor as FlavorPreference)
      : DEFAULT_THEME.flavor
  const accent = ACCENT_NAMES.includes(v.accent as AccentName)
    ? (v.accent as AccentName)
    : DEFAULT_THEME.accent
  return { flavor, accent }
}

export function themeColorOf(flavor: FlavorName): string {
  return hexOf(flavor, 'base')
}

export const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)'

/** Applies the theme to `<html>` and `<meta name="theme-color">`. */
export function applyTheme(theme: ThemeSettings, doc: Document = document): FlavorName {
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
