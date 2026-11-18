import type { AccentName, DarkFlavorName, FlavorName } from './palette.ts'
import { ACCENT_NAMES, DARK_FLAVOR_NAMES, FLAVOR_NAMES, hexOf } from './palette.ts'

export type FlavorPreference = 'system' | FlavorName

export interface ThemeSettings {
  flavor: FlavorPreference
  /** Dark flavor used when `flavor` is `system` and the OS prefers dark. */
  darkFlavor: DarkFlavorName
  accent: AccentName
}

export const DEFAULT_THEME: ThemeSettings = {
  flavor: 'system',
  darkFlavor: 'mocha',
  accent: 'mauve',
}

export function resolveFlavor(theme: ThemeSettings, prefersDark: boolean): FlavorName {
  if (theme.flavor !== 'system') return theme.flavor
  return prefersDark ? theme.darkFlavor : 'latte'
}

/** Coerces an unknown value into valid theme settings, falling back to defaults per field. */
export function normalizeTheme(value: unknown): ThemeSettings {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const flavor =
    v.flavor === 'system' || FLAVOR_NAMES.includes(v.flavor as FlavorName)
      ? (v.flavor as FlavorPreference)
      : DEFAULT_THEME.flavor
  const darkFlavor = DARK_FLAVOR_NAMES.includes(v.darkFlavor as DarkFlavorName)
    ? (v.darkFlavor as DarkFlavorName)
    : DEFAULT_THEME.darkFlavor
  const accent = ACCENT_NAMES.includes(v.accent as AccentName)
    ? (v.accent as AccentName)
    : DEFAULT_THEME.accent
  return { flavor, darkFlavor, accent }
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
