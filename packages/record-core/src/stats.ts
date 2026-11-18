import { allProposals } from './game.ts'
import { playerFaction, teamHasEvil } from './game-roles.ts'
import type { Faction, Game, PlayerId } from './types.ts'

export interface PlayerStats {
  playerId: PlayerId
  faction: Faction | null
  votes: number
  approvals: number
  /** approvals / votes, or null without votes. */
  approveRate: number | null
  /** Approvals given to teams containing a known evil player. */
  approvalsForEvilTeams: number
  timesLeader: number
  /** Times as leader that the team included a known evil player. */
  ledTeamsWithEvil: number
}

/** Per-player voting statistics. Forced proposals are excluded from vote counts. */
export function playerStats(game: Game): PlayerStats[] {
  const proposals = allProposals(game)
  return game.players.map((p) => {
    const voted = proposals.filter((x) => !x.forced)
    const approvals = voted.filter((x) => x.votes[p.id] === 'approve')
    const led = proposals.filter((x) => x.leaderId === p.id)
    return {
      playerId: p.id,
      faction: playerFaction(game, p.id),
      votes: voted.length,
      approvals: approvals.length,
      approveRate: voted.length ? approvals.length / voted.length : null,
      approvalsForEvilTeams: approvals.filter((x) => teamHasEvil(game, x.team)).length,
      timesLeader: led.length,
      ledTeamsWithEvil: led.filter((x) => teamHasEvil(game, x.team)).length,
    }
  })
}
