import { create } from 'zustand'
import {
  QUEST_IDLE,
  questReducer,
  type QuestAction,
  type QuestFlow,
  type QuestSize,
} from './quest.ts'

/** Quest voting lives only in memory; nothing about the cards is stored. */
export const useQuest = create<{
  flow: QuestFlow
  /** How many people go on the next quest. */
  size: QuestSize
  dispatch: (a: QuestAction) => void
  setSize: (size: QuestSize) => void
}>()((set) => ({
  flow: QUEST_IDLE,
  size: 2,
  dispatch: (action) => set((s) => ({ flow: questReducer(s.flow, action) })),
  setSize: (size) => set({ size }),
}))
