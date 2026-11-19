import { useEffect } from 'react'

/**
 * While `active`, the back key and switching away only call `onHide` (to turn a card
 * face down) instead of leaving: an extra history entry absorbs the back press.
 */
export function usePrivacyGuard(active: boolean, onHide: () => void): void {
  useEffect(() => {
    if (!active) return
    window.history.pushState({ guard: true }, '')
    const onPop = () => {
      window.history.pushState({ guard: true }, '')
      onHide()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onHide()
    }
    window.addEventListener('popstate', onPop)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [active, onHide])
}
