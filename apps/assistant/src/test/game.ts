import {
  createGame,
  defaultPlayerNames,
  deriveState,
  gameReducer,
  makePlayers,
  uniformVotes,
  type Game,
} from '@avalon/record-core'
import type { RoleAssignment } from '@avalon/rules'
import { useSession } from '../session/store.ts'
import type { VoteMode } from '../setup/settings.ts'

/** 5 players: seat 1 Merlin, seat 2 Assassin, seat 3 Minion, the rest Loyal. */
export const ROLES_5: RoleAssignment = {
  p1: 'merlin',
  p2: 'assassin',
  p3: 'minion',
  p4: 'loyal',
  p5: 'loyal',
}

/** 7 players: seat 1 Merlin, seat 2 Assassin, seats 3–4 Minions, the rest Loyal. */
export const ROLES_7: RoleAssignment = {
  ...ROLES_5,
  p4: 'minion',
  p6: 'loyal',
  p7: 'loyal',
}

export function newGame(players: 5 | 7 = 5, lady = false): Game {
  const list = makePlayers(defaultPlayerNames(players))
  return createGame({
    id: 'game-1',
    now: '2026-11-20T12:00:00.000Z',
    players: list,
    roleConfig:
      players === 5
        ? { merlin: 1, assassin: 1, minion: 1, loyal: 2 }
        : { merlin: 1, assassin: 1, minion: 2, loyal: 3 },
    roleAssignment: players === 5 ? ROLES_5 : ROLES_7,
    lady: lady ? { initialHolderId: list.at(-1)!.id } : null,
  })
}

/** Records `count` rejected proposals with the derived leader. */
export function reject(game: Game, count: number): Game {
  let g = game
  const ids = g.players.map((p) => p.id)
  for (let i = 0; i < count; i++) {
    const team = ids.slice(0, deriveState(g).teamSize)
    g = gameReducer(g, {
      type: 'propose',
      team,
      votes: uniformVotes(ids, 'reject'),
      inputMode: 'approvals',
    })
  }
  return g
}

export function startSession(game: Game, voteMode: VoteMode = 'leader') {
  useSession.getState().start({ game, voteMode, stage: 'play' })
}

/** The derived leader's team goes (everyone approves) and the quest ends with `failCount`. */
export function completeQuest(game: Game, failCount = 0): Game {
  const ids = game.players.map((p) => p.id)
  const team = ids.slice(0, deriveState(game).teamSize)
  const g = gameReducer(game, {
    type: 'propose',
    team,
    votes: uniformVotes(ids, 'approve'),
    inputMode: 'approvals',
  })
  return gameReducer(g, { type: 'recordQuest', failCount })
}
