/**
 * Lady of the Lake (湖中女神).
 *
 * Used once after quests 2, 3 and 4 (0-based 1, 2, 3) unless the game already ended.
 * The holder inspects a player who has never held the Lady (and is not themself);
 * the Lady then passes to that player. A use cannot be skipped.
 */
import { playerFaction } from './game-roles.ts'
import type { Faction, Game, LadyDeclaration, LadyUse, PlayerId } from './types.ts'

export const LADY_QUESTS = [1, 2, 3] as const
export const LADY_RECOMMENDED_MIN_PLAYERS = 7

export const LADY_DECLARATION_LABEL: Record<LadyDeclaration, string> = {
  good: '宣告好人',
  evil: '宣告壞人',
  none: '未宣告',
}

export function isLadyQuest(questIndex: number): boolean {
  return (LADY_QUESTS as readonly number[]).includes(questIndex)
}

/** Default initial holder: the player to the first leader's right (last to lead in rotation). */
export function defaultLadyHolder(
  players: readonly { id: PlayerId }[],
  firstLeaderId: PlayerId,
): PlayerId {
  const i = players.findIndex((p) => p.id === firstLeaderId)
  const n = players.length
  return players[(i - 1 + n) % n]!.id
}

export function ladyEnabledByDefault(playerCount: number): boolean {
  return playerCount >= LADY_RECOMMENDED_MIN_PLAYERS
}

/** The holder expected for the next use given the recorded uses (by chain, ignoring stored holders). */
function nextHolderAfter(initial: PlayerId, uses: readonly LadyUse[]): PlayerId {
  let holder = initial
  for (const u of uses) holder = u.targetId
  return holder
}

/** Who currently holds the Lady. */
export function currentLadyHolder(game: Pick<Game, 'lady'>): PlayerId | null {
  if (!game.lady) return null
  return nextHolderAfter(game.lady.initialHolderId, game.lady.uses)
}

/** Everyone who has held the Lady before use `index` (initial holder included). */
export function previousHolders(game: Pick<Game, 'lady'>, index: number): Set<PlayerId> {
  const out = new Set<PlayerId>()
  if (!game.lady) return out
  out.add(game.lady.initialHolderId)
  for (const u of game.lady.uses.slice(0, index)) {
    out.add(u.holderId)
    out.add(u.targetId)
  }
  return out
}

export interface LadyTargetOption {
  playerId: PlayerId
  /** Why this player cannot be inspected, or null when allowed. */
  disabledReason: string | null
}

export function ladyTargetOptions(
  game: Pick<Game, 'lady' | 'players'>,
  index: number,
  holderId: PlayerId,
): LadyTargetOption[] {
  const held = previousHolders(game, index)
  return game.players.map((p) => ({
    playerId: p.id,
    disabledReason: p.id === holderId ? '不能查驗自己' : held.has(p.id) ? '曾持有過湖中女神' : null,
  }))
}

/** Re-validates every use against the chain; returns errors per use index. */
export function validateLadyUses(game: Pick<Game, 'lady' | 'players'>): string[][] {
  if (!game.lady) return []
  const ids = new Set(game.players.map((p) => p.id))
  return game.lady.uses.map((u, i) => {
    const errors: string[] = []
    const expected = nextHolderAfter(game.lady!.initialHolderId, game.lady!.uses.slice(0, i))
    if (u.holderId !== expected) errors.push('持有者與前一次查驗結果不一致')
    if (!isLadyQuest(u.afterQuest)) errors.push('湖中女神只能在第 2、3、4 個任務後使用')
    if (!ids.has(u.targetId)) {
      errors.push('查驗對象不在玩家名單中')
      return errors
    }
    const option = ladyTargetOptions(game, i, u.holderId).find((o) => o.playerId === u.targetId)
    if (option?.disabledReason) errors.push(option.disabledReason)
    return errors
  })
}

/** The inspected player's real faction, when their role is known. */
export function ladyTruth(game: Pick<Game, 'roleAssignment'>, use: LadyUse): Faction | null {
  return playerFaction(game, use.targetId)
}

/** True when the declaration contradicts the known real faction. */
export function ladyLied(game: Pick<Game, 'roleAssignment'>, use: LadyUse): boolean {
  const truth = ladyTruth(game, use)
  return truth !== null && use.declared !== 'none' && use.declared !== truth
}

export interface LadyHolderStats {
  playerId: PlayerId
  uses: number
  honest: number
  lied: number
  /** Uses whose truth is unknown or nothing was declared. */
  unknown: number
}

export function ladyHolderStats(game: Game): LadyHolderStats[] {
  const map = new Map<PlayerId, LadyHolderStats>()
  for (const u of game.lady?.uses ?? []) {
    const s = map.get(u.holderId) ?? {
      playerId: u.holderId,
      uses: 0,
      honest: 0,
      lied: 0,
      unknown: 0,
    }
    s.uses++
    const truth = ladyTruth(game, u)
    if (truth === null || u.declared === 'none') s.unknown++
    else if (u.declared === truth) s.honest++
    else s.lied++
    map.set(u.holderId, s)
  }
  return [...map.values()]
}
