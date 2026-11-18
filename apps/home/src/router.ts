import { useMemo, useSyncExternalStore } from 'react'

export type Route = { name: 'tools' } | { name: 'info' } | { name: 'notFound' }

/** Paths home itself serves; anything else under its scope is a 404. */
const HOME_PATHS = new Set(['/', '/index.html', '/404.html'])

export function parseRoute(pathname: string, hash: string): Route {
  if (!HOME_PATHS.has(pathname)) return { name: 'notFound' }
  const h = hash.replace(/^#/, '') || '/'
  if (h === '/') return { name: 'tools' }
  if (h === '/info') return { name: 'info' }
  return { name: 'notFound' }
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

const snapshot = () => `${window.location.pathname}\n${window.location.hash}`

export function useRoute(): Route {
  const current = useSyncExternalStore(subscribe, snapshot)
  return useMemo(() => {
    const [pathname = '/', hash = ''] = current.split('\n')
    return parseRoute(pathname, hash)
  }, [current])
}
