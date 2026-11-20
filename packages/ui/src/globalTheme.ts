import { applyTheme, PREFERS_DARK_QUERY, type ThemeSettings } from '@avalon/theme'
import { onStoreChange, readStore, writeStore } from '@avalon/storage'
import { useEffect, useSyncExternalStore } from 'react'
import { THEME_STORE } from './themeStore.ts'

export { THEME_STORE }

let current: ThemeSettings = readStore(THEME_STORE)
const listeners = new Set<() => void>()
const notify = () => {
  for (const l of listeners) l()
}

// Another tab or app changed the theme: pick it up immediately.
onStoreChange(THEME_STORE.key, () => {
  current = readStore(THEME_STORE)
  notify()
})

export function getGlobalTheme(): ThemeSettings {
  return current
}

export function setGlobalTheme(patch: Partial<ThemeSettings>): void {
  current = { ...current, ...patch }
  writeStore(THEME_STORE, current)
  notify()
}

/** Re-reads the stored theme (e.g. after data was migrated or cleared). */
export function reloadGlobalTheme(): void {
  current = readStore(THEME_STORE)
  notify()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useGlobalTheme(): [ThemeSettings, (patch: Partial<ThemeSettings>) => void] {
  return [useSyncExternalStore(subscribe, getGlobalTheme), setGlobalTheme]
}

/** Keeps `<html data-flavor/data-accent>` and theme-color in sync with the theme and the OS. */
export function useApplyGlobalTheme(): void {
  const [theme] = useGlobalTheme()
  useEffect(() => {
    applyTheme(theme)
    if (theme.mode !== 'system' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(PREFERS_DARK_QUERY)
    const onChange = () => applyTheme(theme)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])
}
