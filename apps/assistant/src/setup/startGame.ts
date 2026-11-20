import { dealRoles, newId, rolesInPlay, secureRandomInt } from '@avalon/pass-play'
import {
  createGame,
  DEFAULT_NAMING,
  makePlayers,
  renderName,
  type Game,
  type RoleAssignment,
  type RoleConfig,
} from '@avalon/record-core'
import type { SeatRole } from '@avalon/rules'
import type { SetupSettings } from './settings.ts'

/**
 * A new game from the setup: roles dealt onto the seats (seat N is player `pN`), a random
 * first leader, and the Lady with the chosen seat (the last one by default) when it is on.
 */
export function startGame(
  setup: SetupSettings,
  now: string,
  randomInt: (max: number) => number = secureRandomInt,
): { game: Game; table: SeatRole[] } {
  const table = dealRoles(rolesInPlay(setup), randomInt)
  const players = makePlayers(setup.names)
  const roleAssignment: RoleAssignment = {}
  const roleConfig: RoleConfig = {}
  for (const { seat, role } of table) {
    roleAssignment[`p${seat}`] = role
    roleConfig[role] = (roleConfig[role] ?? 0) + 1
  }
  const firstLeaderId = players[randomInt(players.length)]!.id
  const game = createGame({
    id: newId(),
    now,
    players,
    firstLeaderId,
    name: {
      auto: renderName(DEFAULT_NAMING, {
        startedAt: new Date(now),
        seq: 1,
        players: players.length,
        winner: null,
      }),
      seq: 1,
    },
    roleConfig,
    roleAssignment,
    lady: setup.lady
      ? { initialHolderId: players[(setup.ladyHolderSeat ?? players.length) - 1]!.id }
      : null,
  })
  return { game, table }
}
