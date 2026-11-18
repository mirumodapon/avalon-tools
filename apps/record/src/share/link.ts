import { packGame, unpackGame, type Game } from '@avalon/record-core'

/** Query parameter carrying a shared game. */
export const SHARE_PARAM = 's'

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function pipe(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const writer = stream.writable.getWriter()
  // Errors surface through the readable side; don't leave these promises unhandled.
  writer.write(bytes as Uint8Array<ArrayBuffer>).catch(() => {})
  writer.close().catch(() => {})
  return new Uint8Array(await new Response(stream.readable).arrayBuffer())
}

const canCompress = () => typeof CompressionStream === 'function'

/**
 * Encodes a game for a URL: compact packed JSON, deflated when that is shorter.
 * Prefix `z` = deflate-raw + base64url, `j` = plain UTF-8 + base64url.
 */
export async function encodeGame(game: Game): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(packGame(game)))
  const plain = `j${toBase64Url(bytes)}`
  if (!canCompress()) return plain
  const zipped = `z${toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))}`
  return zipped.length < plain.length ? zipped : plain
}

export async function decodeGame(param: string): Promise<Game> {
  const kind = param[0]
  let bytes: Uint8Array
  try {
    bytes = fromBase64Url(param.slice(1))
  } catch {
    throw new Error('分享連結格式不支援或已損毀')
  }
  if (kind === 'z') {
    if (typeof DecompressionStream !== 'function') throw new Error('此瀏覽器無法開啟壓縮的分享連結')
    try {
      bytes = await pipe(bytes, new DecompressionStream('deflate-raw'))
    } catch {
      throw new Error('分享連結格式不支援或已損毀')
    }
  } else if (kind !== 'j') {
    throw new Error('分享連結格式不支援或已損毀')
  }
  let packed: unknown
  try {
    packed = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new Error('分享連結格式不支援或已損毀')
  }
  return unpackGame(packed)
}

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
