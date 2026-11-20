import type { Game, PlayerId } from '@avalon/record-core'

/**
 * How a player is named on every screen: `3 號・小明`, or `3 號` when no name was given
 * (blank names become `3號` in the game, see makePlayers).
 */
export function seatLabel(game: Pick<Game, 'players'>, id: PlayerId): string {
  const index = game.players.findIndex((p) => p.id === id)
  const seat = index + 1
  const name = game.players[index]?.name.trim() ?? ''
  return name === '' || name === `${seat}號` ? `${seat} 號` : `${seat} 號・${name}`
}
