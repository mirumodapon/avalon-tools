import { useSyncExternalStore } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'play'; id: string }
  | { name: 'summary'; id: string }
  | { name: 'game'; id: string }
  | { name: 'settings' }
  | { name: 'notFound' }

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/'
  const parts = path.split('/').filter(Boolean)
  const [head, id] = parts
  if (parts.length === 0) return { name: 'home' }
  if (head === 'new' && parts.length === 1) return { name: 'new' }
  if (head === 'settings' && parts.length === 1) return { name: 'settings' }
  if (id && parts.length === 2 && (head === 'play' || head === 'summary' || head === 'game')) {
    return { name: head, id: decodeURIComponent(id) }
  }
  return { name: 'notFound' }
}

export function routePath(route: Route): string {
  switch (route.name) {
    case 'home':
    case 'notFound':
      return '#/'
    case 'new':
      return '#/new'
    case 'settings':
      return '#/settings'
    default:
      return `#/${route.name}/${encodeURIComponent(route.id)}`
  }
}

export function navigate(route: Route, { replace = false } = {}) {
  const path = routePath(route)
  if (replace) window.location.replace(path)
  else window.location.hash = path
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return parseRoute(hash)
}
