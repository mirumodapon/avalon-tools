import { DEFAULT_THEME, normalizeTheme, type ThemeSettings } from '@avalon/theme'
import { globalKey, type StoreSpec } from '@avalon/storage'

/**
 * The theme shared by every tool: `avalon:global:theme`. Kept free of React so the
 * docs site (`@avalon/ui/theme-store`) reads and writes the very same key.
 */
export const THEME_STORE: StoreSpec<ThemeSettings> = {
  key: globalKey('theme'),
  version: 1,
  parse: normalizeTheme,
  fallback: () => DEFAULT_THEME,
}
