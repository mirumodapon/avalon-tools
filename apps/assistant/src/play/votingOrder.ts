import type { Game, PlayerId } from '@avalon/record-core'

/** Who votes in turn when the phone is passed: the leader first, then clockwise. */
export function votingOrder(game: Pick<Game, 'players'>, leaderId: PlayerId): PlayerId[] {
  const ids = game.players.map((p) => p.id)
  const start = Math.max(0, ids.indexOf(leaderId))
  return [...ids.slice(start), ...ids.slice(0, start)]
}
