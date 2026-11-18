import { factionCounts, isPlayerCount } from './rules.ts'
import type { Faction, PlayerId, RoleAssignment, RoleConfig, RoleId } from './types.ts'

export interface RoleDef {
  id: RoleId
  name: string
  nameEn: string
  faction: Faction
  /** At most one copy may be in play. */
  unique: boolean
}

export const ROLES: readonly RoleDef[] = [
  { id: 'merlin', name: '梅林', nameEn: 'Merlin', faction: 'good', unique: true },
  { id: 'percival', name: '派西維爾', nameEn: 'Percival', faction: 'good', unique: true },
  { id: 'loyal', name: '亞瑟的忠臣', nameEn: 'Loyal Servant', faction: 'good', unique: false },
  { id: 'morgana', name: '莫甘娜', nameEn: 'Morgana', faction: 'evil', unique: true },
  { id: 'assassin', name: '刺客', nameEn: 'Assassin', faction: 'evil', unique: true },
  { id: 'mordred', name: '莫德雷德', nameEn: 'Mordred', faction: 'evil', unique: true },
  { id: 'oberon', name: '奧伯倫', nameEn: 'Oberon', faction: 'evil', unique: true },
  {
    id: 'minion',
    name: '莫德雷德的爪牙',
    nameEn: 'Minion of Mordred',
    faction: 'evil',
    unique: false,
  },
]

export const ROLE_IDS: readonly RoleId[] = ROLES.map((r) => r.id)

const BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r])) as Record<RoleId, RoleDef>

export function roleDef(id: RoleId): RoleDef {
  return BY_ID[id]
}

export function roleFaction(id: RoleId): Faction {
  return BY_ID[id].faction
}

export const FACTION_LABEL: Record<Faction, string> = { good: '好人', evil: '壞人' }

/** Common setups per player count. */
const DEFAULT_CONFIGS: Record<number, RoleConfig> = {
  5: { merlin: 1, percival: 1, loyal: 1, morgana: 1, assassin: 1 },
  6: { merlin: 1, percival: 1, loyal: 2, morgana: 1, assassin: 1 },
  7: { merlin: 1, percival: 1, loyal: 2, morgana: 1, assassin: 1, oberon: 1 },
  8: { merlin: 1, percival: 1, loyal: 3, morgana: 1, assassin: 1, minion: 1 },
  9: { merlin: 1, percival: 1, loyal: 4, morgana: 1, assassin: 1, mordred: 1 },
  10: { merlin: 1, percival: 1, loyal: 4, morgana: 1, assassin: 1, mordred: 1, oberon: 1 },
}

export function defaultRoleConfig(playerCount: number): RoleConfig {
  if (!isPlayerCount(playerCount)) throw new RangeError(`不支援的人數：${playerCount}`)
  return { ...DEFAULT_CONFIGS[playerCount] }
}

export function roleCount(config: RoleConfig, id: RoleId): number {
  return config[id] ?? 0
}

export function configFactionCounts(config: RoleConfig): Record<Faction, number> {
  const out = { good: 0, evil: 0 }
  for (const id of ROLE_IDS) out[roleFaction(id)] += roleCount(config, id)
  return out
}

export interface RoleConfigCheck {
  ok: boolean
  errors: string[]
  /** Non-blocking advice, e.g. no assassin. */
  warnings: string[]
  counts: Record<Faction, number>
  required: Record<Faction, number>
}

/** Validates that the configured roles match the faction split for the player count. */
export function validateRoleConfig(config: RoleConfig, playerCount: number): RoleConfigCheck {
  const required = factionCounts(playerCount)
  const counts = configFactionCounts(config)
  const errors: string[] = []
  const warnings: string[] = []
  for (const id of ROLE_IDS) {
    const n = roleCount(config, id)
    if (!Number.isInteger(n) || n < 0) errors.push(`${roleDef(id).name} 數量不正確`)
    else if (roleDef(id).unique && n > 1) errors.push(`${roleDef(id).name} 最多 1 位`)
  }
  for (const f of ['good', 'evil'] as const) {
    if (counts[f] !== required[f]) {
      errors.push(`${FACTION_LABEL[f]}需要 ${required[f]} 位（目前 ${counts[f]} 位）`)
    }
  }
  if (roleCount(config, 'merlin') > 0 && roleCount(config, 'assassin') === 0) {
    warnings.push('有梅林但沒有刺客，將無法進行刺殺')
  }
  if (roleCount(config, 'percival') > 0 && roleCount(config, 'merlin') === 0) {
    warnings.push('派西維爾通常需要梅林')
  }
  return { ok: errors.length === 0, errors, warnings, counts, required }
}

/** How many of each role are already assigned. */
export function assignedCounts(assignment: RoleAssignment): Partial<Record<RoleId, number>> {
  const out: Partial<Record<RoleId, number>> = {}
  for (const role of Object.values(assignment)) {
    if (role) out[role] = (out[role] ?? 0) + 1
  }
  return out
}

/**
 * Remaining copies of `role` for a player to take (ignoring their own current role).
 * Without a config, the limit is uniqueness plus the faction split.
 */
export function remainingFor(
  role: RoleId,
  playerId: PlayerId,
  assignment: RoleAssignment,
  config: RoleConfig | null,
  playerCount: number,
): number {
  const others = { ...assignment }
  delete others[playerId]
  const used = assignedCounts(others)
  if (config) return roleCount(config, role) - (used[role] ?? 0)
  const faction = roleFaction(role)
  const factionUsed = Object.values(others).filter((r) => r && roleFaction(r) === faction).length
  const factionLeft = factionCounts(playerCount)[faction] - factionUsed
  const uniqueLeft = roleDef(role).unique ? 1 - (used[role] ?? 0) : Number.POSITIVE_INFINITY
  return Math.min(factionLeft, uniqueLeft)
}

export function validateAssignment(
  assignment: RoleAssignment,
  config: RoleConfig | null,
  playerCount: number,
): string[] {
  const errors: string[] = []
  const used = assignedCounts(assignment)
  if (config) {
    for (const id of ROLE_IDS) {
      const n = used[id] ?? 0
      if (n > roleCount(config, id)) {
        errors.push(`${roleDef(id).name} 指派了 ${n} 位，但配置只有 ${roleCount(config, id)} 位`)
      }
    }
  } else {
    const required = factionCounts(playerCount)
    for (const id of ROLE_IDS) {
      if (roleDef(id).unique && (used[id] ?? 0) > 1) errors.push(`${roleDef(id).name} 最多 1 位`)
    }
    const counts = { good: 0, evil: 0 }
    for (const [id, n] of Object.entries(used) as [RoleId, number][]) counts[roleFaction(id)] += n
    for (const f of ['good', 'evil'] as const) {
      if (counts[f] > required[f]) errors.push(`${FACTION_LABEL[f]}最多 ${required[f]} 位`)
    }
  }
  return errors
}
