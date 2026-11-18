/**
 * Saved player names (名冊), used to fill seats quickly when setting up a game.
 * Names are trimmed, non-empty and unique; order is preserved.
 */

export const ROSTER_MAX = 100
export const NAME_MAX_LENGTH = 20

/** Default seat names like `3號` are never stored in the roster. */
export function isDefaultSeatName(name: string): boolean {
  return /^\d+號$/.test(name.trim())
}

export function cleanName(name: string): string {
  return name.trim().slice(0, NAME_MAX_LENGTH)
}

export function normalizeRoster(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const v of value) {
    if (typeof v !== 'string') continue
    const name = cleanName(v)
    if (name && !out.includes(name)) out.push(name)
  }
  return out.slice(0, ROSTER_MAX)
}

export type RosterResult = { ok: true; roster: string[] } | { ok: false; error: string }

export function addName(roster: readonly string[], name: string): RosterResult {
  const n = cleanName(name)
  if (!n) return { ok: false, error: '名字不能空白' }
  if (roster.includes(n)) return { ok: false, error: `「${n}」已在名冊中` }
  if (roster.length >= ROSTER_MAX) return { ok: false, error: `名冊最多 ${ROSTER_MAX} 人` }
  return { ok: true, roster: [...roster, n] }
}

export function renameName(roster: readonly string[], index: number, name: string): RosterResult {
  const n = cleanName(name)
  if (!n) return { ok: false, error: '名字不能空白' }
  if (roster.some((r, i) => r === n && i !== index))
    return { ok: false, error: `「${n}」已在名冊中` }
  if (index < 0 || index >= roster.length) return { ok: false, error: '找不到這個名字' }
  return { ok: true, roster: roster.map((r, i) => (i === index ? n : r)) }
}

export function removeName(roster: readonly string[], index: number): string[] {
  return roster.filter((_, i) => i !== index)
}

/** Adds names used in a game (skipping blanks and default seat names). */
export function mergeNames(roster: readonly string[], names: readonly string[]): string[] {
  const extra = names.map(cleanName).filter((n) => n && !isDefaultSeatName(n))
  return normalizeRoster([...roster, ...extra])
}
