export interface Rgb {
  r: number
  g: number
  b: number
}

export function parseHex(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m?.[1]) throw new Error(`Invalid hex color: ${hex}`)
  const n = Number.parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function hexByte(v: number): string {
  return Math.round(Math.min(255, Math.max(0, v)))
    .toString(16)
    .padStart(2, '0')
}

export function toHex({ r, g, b }: Rgb): string {
  return `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`
}

function channel(v: number): number {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string): number {
  const { r, g, b } = parseHex(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG 2.x contrast ratio between two colors. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export function mix(a: string, b: string, weightOfB: number): string {
  const x = parseHex(a)
  const y = parseHex(b)
  return toHex({
    r: x.r + (y.r - x.r) * weightOfB,
    g: x.g + (y.g - x.g) * weightOfB,
    b: x.b + (y.b - x.b) * weightOfB,
  })
}

/**
 * Nudge `color` toward `toward` until it reaches `target` contrast against `background`.
 * Returns the original color when it already passes.
 */
export function ensureContrast(
  color: string,
  background: string,
  toward: string,
  target = 4.5,
): string {
  if (contrastRatio(color, background) >= target) return color
  for (let w = 0.05; w <= 1; w += 0.05) {
    const candidate = mix(color, toward, w)
    if (contrastRatio(candidate, background) >= target) return candidate
  }
  return toward
}
