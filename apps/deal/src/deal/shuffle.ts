import type { RoleId } from '@avalon/rules'
import type { SeatRole } from '@avalon/rules'

/** Uniform integer in [0, max) from crypto.getRandomValues (rejection sampling, no modulo bias). */
export function secureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) throw new RangeError(`max: ${max}`)
  const limit = 2 ** 32 - (2 ** 32 % max)
  const buf = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buf)
    if (buf[0]! < limit) return buf[0]! % max
  }
}

/** Fisher–Yates shuffle into a new array. */
export function shuffle<T>(
  items: readonly T[],
  randomInt: (max: number) => number = secureRandomInt,
): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/** Shuffles the roles onto seats 1..n. */
export function dealRoles(
  roles: readonly RoleId[],
  randomInt?: (max: number) => number,
): SeatRole[] {
  return shuffle(roles, randomInt).map((role, i) => ({ seat: i + 1, role }))
}
