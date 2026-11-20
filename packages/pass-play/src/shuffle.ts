import type { RoleId } from '@avalon/rules'
import type { SeatRole } from '@avalon/rules'
import { randomUint32 } from './random.ts'

/**
 * Uniform integer in [0, max) (rejection sampling, no modulo bias), from
 * crypto.getRandomValues where available (see random.ts for old browsers).
 */
export function secureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) throw new RangeError(`max: ${max}`)
  const limit = 2 ** 32 - (2 ** 32 % max)
  for (;;) {
    const n = randomUint32()
    if (n < limit) return n % max
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
