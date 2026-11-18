import { useSyncExternalStore } from 'react'
import { readShareParam } from './link.ts'

function subscribe(cb: () => void) {
  window.addEventListener('popstate', cb)
  window.addEventListener('sharechange', cb)
  return () => {
    window.removeEventListener('popstate', cb)
    window.removeEventListener('sharechange', cb)
  }
}

/** The shared-game payload in the current URL, if any. */
export function useShareParam(): string | null {
  return useSyncExternalStore(subscribe, readShareParam)
}
