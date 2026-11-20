import { create } from 'zustand'
import { flowReducer, IDLE, type Flow, type FlowAction } from '@avalon/pass-play'

/** The current deal lives only in memory: never in the URL or other storage. */
export const useFlow = create<{ flow: Flow; dispatch: (a: FlowAction) => void }>()((set) => ({
  flow: IDLE,
  dispatch: (action) => set((s) => ({ flow: flowReducer(s.flow, action) })),
}))
