/** Role helpers that read a recorded game. */
import { roleFaction } from '@avalon/rules'
import type { Faction, Game, PlayerId, RoleId } from './types.ts'

export function playerRole(game: Pick<Game, 'roleAssignment'>, id: PlayerId): RoleId | null {
  return game.roleAssignment[id] ?? null
}

export function playerFaction(game: Pick<Game, 'roleAssignment'>, id: PlayerId): Faction | null {
  const role = playerRole(game, id)
  return role ? roleFaction(role) : null
}

export function teamHasEvil(
  game: Pick<Game, 'roleAssignment'>,
  team: readonly PlayerId[],
): boolean {
  return team.some((id) => playerFaction(game, id) === 'evil')
}

export function hasAnyRole(game: Pick<Game, 'roleAssignment'>): boolean {
  return Object.values(game.roleAssignment).some(Boolean)
}
