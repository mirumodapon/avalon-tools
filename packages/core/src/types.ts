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

/** Seat order is the order of `Game.players` (clockwise). */
export interface Player {
  id: PlayerId
  name: string
}

export type Vote = 'approve' | 'reject'

/** Normalized votes: every player has exactly one vote. */
export type Votes = Record<PlayerId, Vote>

/** How votes were entered: 派票 (mark approvers) or 派跳 (mark deviations). */
export type InputMode = 'approvals' | 'anomalies'

/** How votes are displayed: 派票檢視 (full lists) or 派跳檢視 (anomalies only). */
export type ViewMode = 'full' | 'anomaly'

export interface Proposal {
  /** Stable id, e.g. `q2-p3`. */
  id: string
  leaderId: PlayerId
  team: PlayerId[]
  votes: Votes
  inputMode: InputMode
  /** The 5th proposal of a quest goes on the quest regardless of votes. */
  forced: boolean
}

export interface QuestResult {
  failCount: number
}

/** One quest: up to 5 proposals and (once approved) its result. */
export interface Round {
  proposals: Proposal[]
  result: QuestResult | null
}

/** Which roles are in play and how many of each. */
export type RoleConfig = Partial<Record<RoleId, number>>

/** Known roles per player; may be partial. */
export type RoleAssignment = Partial<Record<PlayerId, RoleId>>

export interface Assassination {
  targetId: PlayerId | null
  /** Recorder's judgement; used only when Merlin is not assigned. */
  manualHit: boolean | null
}

export interface GameName {
  /** Name typed by the user; takes precedence when non-empty. */
  custom: string | null
  /** Name generated from the naming template when the game was last saved. */
  auto: string
  /** N-th game of its day, fixed at creation. */
  seq: number
}

export const SCHEMA_VERSION = 1

export interface Game {
  schemaVersion: typeof SCHEMA_VERSION
  id: string
  /** ISO timestamp; also the game's start time for naming. */
  createdAt: string
  updatedAt: string
  /** Set when the settlement page is saved. */
  savedAt: string | null
  name: GameName
  note: string
  players: Player[]
  firstLeaderId: PlayerId
  roleConfig: RoleConfig | null
  roleAssignment: RoleAssignment
  rounds: Round[]
  assassination: Assassination | null
}
