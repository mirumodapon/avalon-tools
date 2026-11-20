import type { QuestCard } from '@avalon/pass-play'
import type { Game, InputMode, PlayerId, Votes } from '@avalon/record-core'
import type { Vote } from '@avalon/rules'
import type { VoteMode } from '../setup/settings.ts'

/** 發角色 → the rounds → the results screen. */
export type Stage = 'deal' | 'play' | 'finished'

/**
 * The step under way but not yet recorded in the game, saved so that leaving and coming back
 * lands on the same step. A private step resumes at the hand-off of whoever's turn it is,
 * never with a card face up.
 */
export type Progress =
  /** Dealing: how many seats have seen their card. */
  | { kind: 'deal'; seen: number }
  /** A team is chosen; with passed-phone voting, the votes cast so far (in voting order). */
  | { kind: 'team'; team: PlayerId[]; cast: Vote[] }
  /** Every vote is in and shown, waiting for 繼續. */
  | { kind: 'voted'; team: PlayerId[]; votes: Votes; inputMode: InputMode }
  /** Quest cards played so far (in turn order), and whether the result has been revealed. */
  | { kind: 'quest'; played: QuestCard[]; revealed: boolean }
  /** The Lady's target, and whether the holder has looked. */
  | { kind: 'lady'; target: PlayerId; seen: boolean }

export interface Session {
  game: Game
  voteMode: VoteMode
  /** Fixed when the game starts: vote on the forced proposal (false = all approve). */
  forcedVote: boolean
  stage: Stage
  progress: Progress | null
}
