/**
 * Remembers where the user was so the installed app reopens on the same screen.
 * Stored apart from settings and games; losing it only means starting at home.
 */
import { storageKey } from '@avalon/storage'

const KEY = storageKey('record', 'session')

export interface Session {
  /** Last route hash, e.g. `#/play/<id>`. */
  hash: string
  /** Scroll position per route hash. */
  scroll: Record<string, number>
}

function read(): Session {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Session> | null
    return { hash: typeof v?.hash === 'string' ? v.hash : '', scroll: v?.scroll ?? {} }
  } catch {
    return { hash: '', scroll: {} }
  }
}

function write(s: Session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // best effort
  }
}

export function isStandalone(): boolean {
  try {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches === true ||
      (navigator as { standalone?: boolean }).standalone === true
    )
  } catch {
    return false
  }
}

const isHome = (hash: string) => hash === '' || hash === '#' || hash === '#/'

/**
 * Hash to restore on launch, or null. Only for the installed app opened at its start
 * URL (no route in the address, no shared game), and only if the last screen wasn't home.
 */
export function hashToRestore(
  current: { hash: string; search: string },
  saved: Session,
  standalone: boolean,
): string | null {
  if (!standalone || !isHome(current.hash)) return null
  if (new URLSearchParams(current.search).has('s')) return null
  return isHome(saved.hash) ? null : saved.hash
}

/** Call before the first render. */
export function restoreLastScreen(): void {
  const target = hashToRestore(window.location, read(), isStandalone())
  if (target) window.history.replaceState(null, '', `${window.location.pathname}${target}`)
}

/** Saved scroll for the current route (used once after the restored screen renders). */
export function savedScroll(hash: string): number {
  return read().scroll[hash] ?? 0
}

function saveRoute() {
  write({ ...read(), hash: window.location.hash })
}

function saveScroll() {
  const s = read()
  write({
    hash: window.location.hash,
    scroll: { ...s.scroll, [window.location.hash]: window.scrollY },
  })
}

/** Tracks route and scroll so they survive the app being closed. */
export function trackSession(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  const onScroll = () => {
    clearTimeout(timer)
    timer = setTimeout(saveScroll, 200)
  }
  const onHide = () => {
    if (document.visibilityState === 'hidden') saveScroll()
  }
  saveRoute()
  window.addEventListener('hashchange', saveRoute)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('pagehide', saveScroll)
  document.addEventListener('visibilitychange', onHide)
  return () => {
    clearTimeout(timer)
    window.removeEventListener('hashchange', saveRoute)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('pagehide', saveScroll)
    document.removeEventListener('visibilitychange', onHide)
  }
}
