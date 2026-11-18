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
 * Seats roster picks in order from seat 1. Seats after the picks keep their
 * previous names unless that name was just picked (avoids duplicates).
 */
export function seatPicked(
  prev: readonly string[],
  picked: readonly string[],
  count: number,
): string[] {
  const rest = prev.slice(picked.length).map((n) => (picked.includes(n.trim()) ? '' : n))
  return Array.from({ length: count }, (_, i) => picked[i] ?? rest[i - picked.length] ?? '')
}
