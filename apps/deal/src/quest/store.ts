import { create } from 'zustand'
import { recordResult } from '../history/save.ts'
import {
  QUEST_IDLE,
  questReducer,
  type QuestAction,
  type QuestFlow,
  type QuestSize,
} from '@avalon/pass-play'

/**
 * Quest voting lives in memory; once every card is in, the result is saved to the
 * history with the cards in the order they were played.
 */
export const useQuest = create<{
  flow: QuestFlow
  /** How many people go on the next quest. */
  size: QuestSize
  dispatch: (a: QuestAction) => void
  setSize: (size: QuestSize) => void
}>()((set) => ({
  flow: QUEST_IDLE,
  size: 2,
  dispatch: (action) =>
    set((s) => {
      const flow = questReducer(s.flow, action)
      if (s.flow.step === 'choose' && flow.step === 'collected') {
        void recordResult({ kind: 'quest', size: flow.size, fails: flow.fails, cards: flow.played })
      }
      return { flow }
    }),
  setSize: (size) => set({ size }),
}))
