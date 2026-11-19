import { create } from 'zustand'
import { recordResult } from '../history/save.ts'
import { LADY_IDLE, ladyReducer, type LadyAction, type LadyFlow } from './lady.ts'

/** The Lady lives in memory; once the holder has looked, what was shown is saved to the history. */
export const useLady = create<{ flow: LadyFlow; dispatch: (a: LadyAction) => void }>()((set) => ({
  flow: LADY_IDLE,
  dispatch: (action) =>
    set((s) => {
      const flow = ladyReducer(s.flow, action)
      if (s.flow.step === 'reveal' && flow.step === 'passed') {
        void recordResult({ kind: 'lady', shown: s.flow.shown })
      }
      return { flow }
    }),
}))
