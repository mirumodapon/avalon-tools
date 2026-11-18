import {
  allProposals,
  convertFlags,
  uniformVotes,
  votesFromFlags,
  type Game,
  type InputMode,
  type PlayerId,
  type Votes,
} from '@avalon/record-core'

/**
 * Proposal being entered. `flags` are the players marked in the current input mode:
 * approvers (派票) or players deviating from the team default (派跳).
 */
export interface ProposalDraft {
  team: PlayerId[]
  mode: InputMode
  flags: PlayerId[]
  /** Whether any vote has been entered; an untouched draft takes each mode's defaults. */
  touched: boolean
}

/** Follows the recorder's habit: the mode of the game's last proposal, else `fallback`. */
export function initialInputMode(game: Pick<Game, 'rounds'>, fallback: InputMode): InputMode {
  return allProposals(game).at(-1)?.inputMode ?? fallback
}

export function emptyDraft(mode: InputMode): ProposalDraft {
  return { team: [], mode, flags: [], touched: false }
}

function toggle(list: readonly PlayerId[], id: PlayerId): PlayerId[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

/**
 * Toggles team membership. In 派跳 mode a flag means "deviates from the team default",
 * so a flagged player whose membership changes is reset to the new default.
 */
export function toggleTeam(draft: ProposalDraft, id: PlayerId): ProposalDraft {
  return {
    ...draft,
    team: toggle(draft.team, id),
    flags: draft.mode === 'anomalies' ? draft.flags.filter((x) => x !== id) : draft.flags,
  }
}

export function toggleFlag(draft: ProposalDraft, id: PlayerId): ProposalDraft {
  return { ...draft, flags: toggle(draft.flags, id), touched: true }
}

/** Switches input mode, converting marks so the described votes are unchanged. */
export function switchMode(
  draft: ProposalDraft,
  mode: InputMode,
  playerIds: readonly PlayerId[],
): ProposalDraft {
  if (draft.mode === mode) return draft
  if (!draft.touched) return { ...draft, mode, flags: [] }
  return {
    ...draft,
    mode,
    flags: convertFlags(draft.mode, mode, playerIds, draft.team, draft.flags),
  }
}

export function draftVotes(draft: ProposalDraft, playerIds: readonly PlayerId[]): Votes {
  return votesFromFlags(draft.mode, playerIds, draft.team, draft.flags)
}

/** Sets every player's vote, expressed in the draft's current mode. */
export function setAll(
  draft: ProposalDraft,
  vote: 'approve' | 'reject',
  playerIds: readonly PlayerId[],
): ProposalDraft {
  const flags = convertFlags(
    'approvals',
    draft.mode,
    playerIds,
    draft.team,
    vote === 'approve' ? playerIds : [],
  )
  return { ...draft, flags, touched: true }
}

export function forcedApproveVotes(playerIds: readonly PlayerId[]): Votes {
  return uniformVotes(playerIds, 'approve')
}
