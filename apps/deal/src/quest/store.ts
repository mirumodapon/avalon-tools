import type { PlayerCount } from '@avalon/rules'
import { create } from 'zustand'
import { QUEST_IDLE, questReducer, type QuestAction, type QuestFlow } from './quest.ts'

export interface QuestDraft {
  playerCount: PlayerCount | null
  questIndex: number
  team: number[]
}

/** Quest voting lives only in memory; nothing about the cards is stored. */
export const useQuest = create<{
  flow: QuestFlow
  draft: QuestDraft
  dispatch: (a: QuestAction) => void
  setDraft: (patch: Partial<QuestDraft>) => void
}>()((set) => ({
  flow: QUEST_IDLE,
  draft: { playerCount: null, questIndex: 0, team: [] },
  dispatch: (action) => set((s) => ({ flow: questReducer(s.flow, action) })),
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
}))
