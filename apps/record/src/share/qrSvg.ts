import { encode } from 'uqr'

/** Light modules kept around the code so scanners find its edges. */
export const QUIET_ZONE = 2

/** The QR code for `value` as rows of dark (true) / light modules, quiet zone included. */
export function qrModules(value: string): boolean[][] {
  return encode(value, { ecc: 'M', border: QUIET_ZONE }).data
}

/** One SVG path with a unit square per dark module; `size` is the side in modules. */
export function qrPath(modules: readonly (readonly boolean[])[]): { d: string; size: number } {
  let d = ''
  modules.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) d += `M${x} ${y}h1v1h-1z`
    }),
  )
  return { d, size: modules.length }
}
