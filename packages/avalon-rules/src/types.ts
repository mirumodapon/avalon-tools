/** Shared Avalon rule types (no game-record specifics). */
export type PlayerId = string

export type Faction = 'good' | 'evil'

export type RoleId =
  | 'merlin'
  | 'percival'
  | 'loyal'
  | 'morgana'
  | 'assassin'
  | 'mordred'
  | 'oberon'
  | 'minion'

export type Vote = 'approve' | 'reject'

/** Normalized votes: every player has exactly one vote. */
export type Votes = Record<PlayerId, Vote>

/** Which roles are in play and how many of each. */
export type RoleConfig = Partial<Record<RoleId, number>>

/** Known roles per player; may be partial. */
export type RoleAssignment = Partial<Record<PlayerId, RoleId>>
