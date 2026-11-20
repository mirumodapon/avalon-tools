import { DARK_FLAVOR, LIGHT_FLAVOR, normalizeTheme, type ThemeMode } from '@avalon/theme'

/** VitePress keeps its light/dark choice here as a bare string. */
export const VP_APPEARANCE_KEY = 'vitepress-theme-appearance'

type Appearance = 'auto' | 'light' | 'dark'

const TO_APPEARANCE: Record<ThemeMode, Appearance> = {
  system: 'auto',
  light: 'light',
  dark: 'dark',
}

export function appearanceOf(mode: ThemeMode): Appearance {
  return TO_APPEARANCE[mode]
}

export function modeOf(appearance: string | null): ThemeMode {
  return appearance === 'light' || appearance === 'dark' ? appearance : 'system'
}

/**
 * Inline script run before VitePress's dark-mode check: copies the tools' shared theme
 * (`avalon:global:theme`, `{ version, data: { mode, accent } }`) into VitePress's key,
 * so the docs open in the same light/dark mode as the tools.
 */
export function appearanceBootstrapScript(themeKey: string): string {
  const j = JSON.stringify
  return `(function(){try{var raw=localStorage.getItem(${j(themeKey)});if(!raw)return;var d=JSON.parse(raw).data||{};var m=d.mode==='light'||d.mode==='dark'?d.mode:'system';localStorage.setItem(${j(VP_APPEARANCE_KEY)},m==='system'?'auto':m)}catch(e){}})()`
}

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/**
 * After the reader toggles light/dark in the docs: writes the new mode back to the
 * shared theme, keeping its accent, so every tool follows.
 */
export function writeBackMode(storage: StorageLike, themeKey: string, version: number): void {
  const mode = modeOf(storage.getItem(VP_APPEARANCE_KEY))
  let current: unknown
  try {
    current = JSON.parse(storage.getItem(themeKey) ?? 'null')?.data
  } catch {
    current = undefined
  }
  const theme = normalizeTheme(current)
  if (theme.mode === mode && current !== undefined) return
  storage.setItem(themeKey, JSON.stringify({ version, data: { ...theme, mode } }))
}

/** The Catppuccin flavor matching VitePress's `.dark` class. */
export function flavorFor(dark: boolean): string {
  return dark ? DARK_FLAVOR : LIGHT_FLAVOR
}
