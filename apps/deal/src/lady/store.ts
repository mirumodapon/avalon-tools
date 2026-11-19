import { create } from 'zustand'
import { LADY_IDLE, ladyReducer, type LadyAction, type LadyFlow } from './lady.ts'

/** The Lady lives only in memory; what was shown is never stored. */
export const useLady = create<{ flow: LadyFlow; dispatch: (a: LadyAction) => void }>()((set) => ({
  flow: LADY_IDLE,
  dispatch: (action) => set((s) => ({ flow: ladyReducer(s.flow, action) })),
}))
