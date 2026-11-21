import jsQR from 'jsqr'
import { describe, expect, it } from 'vitest'
import { qrModules, qrPath } from './qrSvg.ts'

/** Draws the modules as RGBA pixels (4 px each) and reads them back with a real scanner. */
function scan(modules: boolean[][]): string | null {
  const px = 4
  const size = modules.length * px
  const rgba = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dark = modules[Math.floor(y / px)]![Math.floor(x / px)]
      const i = (y * size + x) * 4
      rgba.fill(dark ? 0 : 255, i, i + 3)
      rgba[i + 3] = 255
    }
  }
  return jsQR(rgba, size, size)?.data ?? null
}

describe('qrModules', () => {
  const url = 'https://avalon.example/record/?s=zizbUUQqoLPX1yDZMDDaqTE0rz0_ycTH0jyhX0jE'

  it('encodes a share link that a scanner reads back', () => {
    expect(scan(qrModules(url))).toBe(url)
  })

  it('keeps a two-module quiet zone around the code', () => {
    const m = qrModules(url)
    expect(m[0]!.every((dark) => !dark)).toBe(true)
    expect(m[1]!.every((dark) => !dark)).toBe(true)
    expect(m[2]!.slice(2, 9).every(Boolean)).toBe(true) // the finder's top edge
  })
})

describe('qrPath', () => {
  it('draws one unit square per dark module', () => {
    const { d, size } = qrPath([
      [false, true],
      [true, false],
    ])
    expect(size).toBe(2)
    expect(d).toBe('M1 0h1v1h-1zM0 1h1v1h-1z')
  })
})
