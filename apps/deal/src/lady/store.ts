import type { PlayerCount } from '@avalon/rules'
import { create } from 'zustand'
import { LADY_IDLE, ladyReducer, type LadyAction, type LadyState } from './lady.ts'

/** The Lady lives only in memory for this game; what was shown is never stored. */
export const useLady = create<{
  state: LadyState
  playerCount: PlayerCount | null
  dispatch: (a: LadyAction) => void
  setPlayerCount: (n: PlayerCount) => void
}>()((set) => ({
  state: LADY_IDLE,
  playerCount: null,
  dispatch: (action) => set((s) => ({ state: ladyReducer(s.state, action) })),
  // A different table is a different game: who held the Lady no longer applies.
  setPlayerCount: (n) => set({ playerCount: n, state: LADY_IDLE }),
}))
