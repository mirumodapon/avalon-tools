/**
 * Randomness that also works on old phones. `crypto.randomUUID` needs iOS 15.4 /
 * Chrome 92 and HTTPS; `crypto.getRandomValues` is older but can still be missing.
 * Each falls back to the next best source instead of throwing.
 */

interface CryptoLike {
  getRandomValues?: (buf: Uint32Array) => Uint32Array
  randomUUID?: () => string
}

/** The Web Crypto object if the browser has one (tests can pass a stand-in). */
export function getCrypto(): CryptoLike | undefined {
  try {
    return globalThis.crypto as CryptoLike | undefined
  } catch {
    return undefined
  }
}

/** One random 32-bit unsigned integer. */
export function randomUint32(c: CryptoLike | undefined = getCrypto()): number {
  if (typeof c?.getRandomValues === 'function') {
    try {
      return c.getRandomValues(new Uint32Array(1))[0]!
    } catch {
      // fall through
    }
  }
  return Math.floor(Math.random() * 2 ** 32)
}

/** A random v4 UUID (record ids). */
export function newId(c: CryptoLike | undefined = getCrypto()): string {
  if (typeof c?.randomUUID === 'function') {
    try {
      return c.randomUUID()
    } catch {
      // fall through
    }
  }
  const bytes: number[] = []
  for (let i = 0; i < 4; i++) {
    const n = randomUint32(c)
    bytes.push(n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255)
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
