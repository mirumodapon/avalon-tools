/** Seat-name helpers for the setup page. Empty seats fall back to `N號` when the game starts. */

export function emptySeats(count: number): string[] {
  return Array.from({ length: count }, () => '')
}

export function resizeSeats(names: readonly string[], count: number): string[] {
  return Array.from({ length: count }, (_, i) => names[i] ?? '')
}

/** First empty seat at or after `from`, wrapping around; -1 when all seats are filled. */
export function nextEmptySeat(names: readonly string[], from = 0): number {
  const n = names.length
  for (let k = 0; k < n; k++) {
    const i = (from + k) % n
    if (!names[i]?.trim()) return i
  }
  return -1
}

/**
 * Taps a roster name: removes it if already seated, otherwise puts it in the
 * active seat (or the first empty seat) and advances to the next empty seat.
 */
export function tapRosterName(
  names: readonly string[],
  active: number,
  name: string,
): { names: string[]; active: number } {
  const seated = names.findIndex((n) => n.trim() === name)
  if (seated >= 0) {
    const next = names.map((n, i) => (i === seated ? '' : n))
    return { names: next, active: seated }
  }
  const target = active >= 0 && active < names.length ? active : nextEmptySeat(names)
  if (target < 0) return { names: [...names], active }
  const next = names.map((n, i) => (i === target ? name : n))
  return { names: next, active: nextEmptySeat(next, target + 1) }
}
