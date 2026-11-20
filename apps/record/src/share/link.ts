import { decodeGame, encodeGame, SHARE_PARAM, type Game } from '@avalon/record-core'

export { decodeGame, encodeGame, SHARE_PARAM }

export async function shareUrl(game: Game, location: Location = window.location): Promise<string> {
  const url = new URL(location.pathname, location.origin)
  url.searchParams.set(SHARE_PARAM, await encodeGame(game))
  return url.toString()
}

export function readShareParam(): string | null {
  return new URLSearchParams(window.location.search).get(SHARE_PARAM)
}

/** Removes the share data from the address bar, keeping the current route. */
export function clearShareParam(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete(SHARE_PARAM)
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  window.dispatchEvent(new Event('sharechange'))
}

/** Extracts the share payload from scanned text (a share link, any origin). */
export function shareParamFromText(text: string): string | null {
  try {
    const url = new URL(text.trim())
    const param = url.searchParams.get(SHARE_PARAM)
    return param && /^[zj][A-Za-z0-9_-]+$/.test(param) ? param : null
  } catch {
    return null
  }
}

/** Opens a shared game in this app (same preview/import flow as following the link). */
export function openShareParam(param: string): void {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set(SHARE_PARAM, param)
  url.hash = '#/'
  window.history.pushState(null, '', url.toString())
  window.dispatchEvent(new Event('sharechange'))
}

/** Validates scanned text: returns the payload only if it decodes into a game. */
export async function validScannedShare(text: string): Promise<string | null> {
  const param = shareParamFromText(text)
  if (!param) return null
  try {
    await decodeGame(param)
    return param
  } catch {
    return null
  }
}
