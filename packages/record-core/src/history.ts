import { isProposalApproved, playerIds, questOutcome, type QuestOutcome } from './game.ts'
import { countApprovals, failsRequired } from '@avalon/rules'
import type { Game, PlayerId, Proposal, QuestResult } from './types.ts'
import { anomaliesFromVotes, type Anomalies } from './votes.ts'

export interface HistoryRow {
  questIndex: number
  /** 1-based attempt within the quest. */
  attempt: number
  proposal: Proposal
  approvals: number
  approved: boolean
  anomalies: Anomalies
  /** Set on the proposal that went on the quest, once the result is recorded. */
  quest: (QuestResult & { outcome: QuestOutcome; failsRequired: number }) | null
}

/** Flattens a game into one row per proposal, in recording order. */
export function historyRows(game: Game): HistoryRow[] {
  const ids = playerIds(game)
  return game.rounds.flatMap((round, questIndex) =>
    round.proposals.map((proposal, i) => {
      const isLast = i === round.proposals.length - 1
      const outcome = isLast ? questOutcome(game, questIndex, round) : null
      return {
        questIndex,
        attempt: i + 1,
        proposal,
        approvals: countApprovals(proposal.votes),
        approved: isProposalApproved(game, proposal),
        anomalies: anomaliesFromVotes(ids, proposal.team, proposal.votes),
        quest:
          outcome && round.result
            ? {
                ...round.result,
                outcome,
                failsRequired: failsRequired(game.players.length, questIndex),
              }
            : null,
      }
    }),
  )
}

export type CellAnomaly = 'outside-approve' | 'inside-reject' | null

export function cellAnomaly(proposal: Proposal, playerId: PlayerId): CellAnomaly {
  const inTeam = proposal.team.includes(playerId)
  const vote = proposal.votes[playerId]
  if (inTeam && vote === 'reject') return 'inside-reject'
  if (!inTeam && vote === 'approve') return 'outside-approve'
  return null
}
