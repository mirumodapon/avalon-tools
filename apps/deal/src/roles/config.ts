import {
  factionCounts,
  isPlayerCount,
  roleDef,
  type Faction,
  type PlayerCount,
  type RoleId,
} from '@avalon/rules'

/** Special roles that can be switched on, in display order per faction. */
export const SPECIAL_ROLES: Record<Faction, readonly RoleId[]> = {
  good: ['merlin', 'percival'],
  evil: ['assassin', 'morgana', 'mordred', 'oberon'],
}
export const ALL_SPECIAL_ROLES: readonly RoleId[] = [...SPECIAL_ROLES.good, ...SPECIAL_ROLES.evil]

/** Fills the seats no special role takes. */
export const FILLER: Record<Faction, RoleId> = { good: 'loyal', evil: 'minion' }

export const DEFAULT_SPECIAL: readonly RoleId[] = ['merlin', 'assassin']

export interface DealConfig {
  playerCount: PlayerCount
  /** Enabled special roles. */
  special: readonly RoleId[]
}

export interface ConfigCheck {
  ok: boolean
  /** Block dealing. */
  errors: string[]
  /** Allowed but probably not intended. */
  warnings: string[]
  /** Informational. */
  notes: string[]
  required: Record<Faction, number>
  special: Record<Faction, number>
}

export function specialCounts(special: readonly RoleId[]): Record<Faction, number> {
  const out = { good: 0, evil: 0 }
  for (const id of new Set(special)) out[roleDef(id).faction]++
  return out
}

export function checkConfig({ playerCount, special }: DealConfig): ConfigCheck {
  const required = factionCounts(playerCount)
  const counts = specialCounts(special)
  const has = (id: RoleId) => special.includes(id)
  const errors: string[] = []
  const warnings: string[] = []
  const notes: string[] = []
  if (counts.good > required.good) {
    errors.push(`特殊好人有 ${counts.good} 位，但 ${playerCount} 人只有 ${required.good} 位好人`)
  }
  if (counts.evil > required.evil) {
    errors.push(`特殊壞人有 ${counts.evil} 位，但 ${playerCount} 人只有 ${required.evil} 位壞人`)
  }
  if (has('percival') && !has('merlin'))
    warnings.push('有派西維爾但沒有梅林，派西維爾沒有人可以保護')
  if (has('morgana') && !has('percival')) notes.push('沒有派西維爾，莫甘娜的能力沒有作用')
  return { ok: errors.length === 0, errors, warnings, notes, required, special: counts }
}

/** Every role in play: the enabled specials plus loyal servants and minions. */
export function rolesInPlay(config: DealConfig): RoleId[] {
  const check = checkConfig(config)
  if (!check.ok) throw new Error(check.errors.join('；'))
  const roles: RoleId[] = []
  for (const faction of ['good', 'evil'] as const) {
    const specials = SPECIAL_ROLES[faction].filter((id) => config.special.includes(id))
    roles.push(...specials)
    for (let i = specials.length; i < check.required[faction]; i++) roles.push(FILLER[faction])
  }
  return roles
}

export function normalizePlayerCount(n: unknown): PlayerCount {
  return typeof n === 'number' && isPlayerCount(n) ? n : 5
}

export function normalizeSpecial(value: unknown): RoleId[] {
  if (!Array.isArray(value)) return [...DEFAULT_SPECIAL]
  return ALL_SPECIAL_ROLES.filter((id) => value.includes(id))
}
