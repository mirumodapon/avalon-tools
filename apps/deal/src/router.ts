import { useMemo, useSyncExternalStore } from 'react'

export type Route =
  | { name: 'setup' }
  | { name: 'history' }
  | { name: 'record'; id: string }
  | { name: 'quest' }

/** Deal results never go into the URL: only record ids, which reveal nothing by themselves. */
export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#/, '').split('/').filter(Boolean)
  if (parts[0] === 'quest' && parts.length === 1) return { name: 'quest' }
  if (parts[0] === 'history' && parts.length === 1) return { name: 'history' }
  if (parts[0] === 'history' && parts.length === 2)
    return { name: 'record', id: decodeURIComponent(parts[1]!) }
  return { name: 'setup' }
}

export function routePath(route: Route): string {
  switch (route.name) {
    case 'setup':
      return '#/'
    case 'history':
      return '#/history'
    case 'quest':
      return '#/quest'
    case 'record':
      return `#/history/${encodeURIComponent(route.id)}`
  }
}

export function navigate(route: Route): void {
  window.location.hash = routePath(route)
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return useMemo(() => parseRoute(hash), [hash])
}
