import { applyTheme, PREFERS_DARK_QUERY } from '@avalon/theme'
import { useEffect } from 'react'
import { useSettings } from './store.ts'

/** Keeps `<html data-flavor/data-accent>` and theme-color in sync with settings and the OS. */
export function useApplyTheme() {
  const theme = useSettings((s) => s.settings.theme)
  useEffect(() => {
    applyTheme(theme)
    if (theme.mode !== 'system' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(PREFERS_DARK_QUERY)
    const onChange = () => applyTheme(theme)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])
}
