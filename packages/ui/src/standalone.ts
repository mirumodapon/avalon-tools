/** True when running as an installed app (home-screen / desktop PWA). */
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

/** Set in a window that was opened as the installed 阿瓦隆工具集 (home) app. */
const HOME_WINDOW_KEY = 'avalon:global:homeWindow'

/**
 * Called by home when it runs as an installed app. Tools opened from it stay in the
 * same window (and sessionStorage), so they know the way back to home is in reach.
 */
export function markHomeWindow(): void {
  try {
    if (isStandalone()) sessionStorage.setItem(HOME_WINDOW_KEY, '1')
  } catch {
    // storage unavailable: tools then hide the home link when installed
  }
}

/**
 * Whether a tool should link back to home. Not when the tool is its own installed
 * app: home is outside its scope and the link would leave the app.
 */
export function canLinkHome(): boolean {
  if (!isStandalone()) return true
  try {
    return sessionStorage.getItem(HOME_WINDOW_KEY) !== null
  } catch {
    return false
  }
}
