import type { Game } from '@avalon/record-core'
import type { VoteMode } from '../setup/settings.ts'

/** 發角色 → the rounds → the results screen. */
export type Stage = 'deal' | 'play' | 'finished'

/**
 * The game in progress. Only public, settled facts live here (and in storage): a secret
 * step under way (a vote, quest cards, the Lady) stays in memory and starts over after a reload.
 */
export interface Session {
  game: Game
  voteMode: VoteMode
  stage: Stage
}
