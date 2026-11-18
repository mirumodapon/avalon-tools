/**
 * Conversions between the normalized vote record and the two input/display forms.
 *
 * - 派票 (approvals): the set of players who approved.
 * - 派跳 (anomalies): the set of players who deviated from the default
 *   "team approves, everyone else rejects":
 *   - 場外白 (outside approve): not on the team but approved
 *   - 場內黑 (inside reject): on the team but rejected
 */
import type { InputMode, PlayerId, Vote, Votes } from './types.ts'

export interface Anomalies {
  outsideApprove: PlayerId[]
  insideReject: PlayerId[]
}

export function votesFromApprovals(
  playerIds: readonly PlayerId[],
  approvers: Iterable<PlayerId>,
): Votes {
  const set = new Set(approvers)
  return Object.fromEntries(
    playerIds.map((id) => [id, set.has(id) ? 'approve' : 'reject']),
  ) as Votes
}

export function approversFromVotes(playerIds: readonly PlayerId[], votes: Votes): PlayerId[] {
  return playerIds.filter((id) => votes[id] === 'approve')
}

export function defaultVote(team: readonly PlayerId[], playerId: PlayerId): Vote {
  return team.includes(playerId) ? 'approve' : 'reject'
}

/** Builds votes from the set of players who deviated from the team-based default. */
export function votesFromDeviations(
  playerIds: readonly PlayerId[],
  team: readonly PlayerId[],
  deviators: Iterable<PlayerId>,
): Votes {
  const set = new Set(deviators)
  return Object.fromEntries(
    playerIds.map((id) => {
      const def = defaultVote(team, id)
      return [id, set.has(id) ? (def === 'approve' ? 'reject' : 'approve') : def]
    }),
  ) as Votes
}

export function deviationsFromVotes(
  playerIds: readonly PlayerId[],
  team: readonly PlayerId[],
  votes: Votes,
): PlayerId[] {
  return playerIds.filter((id) => votes[id] !== defaultVote(team, id))
}

export function anomaliesFromVotes(
  playerIds: readonly PlayerId[],
  team: readonly PlayerId[],
  votes: Votes,
): Anomalies {
  const outsideApprove: PlayerId[] = []
  const insideReject: PlayerId[] = []
  for (const id of playerIds) {
    const inTeam = team.includes(id)
    if (!inTeam && votes[id] === 'approve') outsideApprove.push(id)
    if (inTeam && votes[id] === 'reject') insideReject.push(id)
  }
  return { outsideApprove, insideReject }
}

export function votesFromAnomalies(
  playerIds: readonly PlayerId[],
  team: readonly PlayerId[],
  anomalies: Anomalies,
): Votes {
  return votesFromDeviations(playerIds, team, [
    ...anomalies.outsideApprove,
    ...anomalies.insideReject,
  ])
}

/** The players marked in an input mode for the given votes. */
export function flagsFromVotes(
  mode: InputMode,
  playerIds: readonly PlayerId[],
  team: readonly PlayerId[],
  votes: Votes,
): PlayerId[] {
  return mode === 'approvals'
    ? approversFromVotes(playerIds, votes)
    : deviationsFromVotes(playerIds, team, votes)
}

/** Votes described by the players marked in an input mode. */
export function votesFromFlags(
  mode: InputMode,
  playerIds: readonly PlayerId[],
  team: readonly PlayerId[],
  flags: Iterable<PlayerId>,
): Votes {
  return mode === 'approvals'
    ? votesFromApprovals(playerIds, flags)
    : votesFromDeviations(playerIds, team, flags)
}

/** Converts marked players from one input mode to another without losing information. */
export function convertFlags(
  from: InputMode,
  to: InputMode,
  playerIds: readonly PlayerId[],
  team: readonly PlayerId[],
  flags: Iterable<PlayerId>,
): PlayerId[] {
  if (from === to) return playerIds.filter((id) => new Set(flags).has(id))
  return flagsFromVotes(to, playerIds, team, votesFromFlags(from, playerIds, team, flags))
}

export function uniformVotes(playerIds: readonly PlayerId[], vote: Vote): Votes {
  return Object.fromEntries(playerIds.map((id) => [id, vote])) as Votes
}
