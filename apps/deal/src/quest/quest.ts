import { shuffle } from '../deal/shuffle.ts'

export type QuestCard = 'success' | 'fail'

/** How many people can go on a quest (2–5 across 5–10 players). */
export const QUEST_SIZES = [2, 3, 4, 5] as const
export type QuestSize = (typeof QUEST_SIZES)[number]

export function isQuestSize(n: unknown): n is QuestSize {
  return (QUEST_SIZES as readonly unknown[]).includes(n)
}

/** The two buttons in a random order, so where someone taps gives nothing away. */
export function cardOrder(randomInt?: (max: number) => number): [QuestCard, QuestCard] {
  return shuffle(['success', 'fail'] as QuestCard[], randomInt) as [QuestCard, QuestCard]
}

/**
 * Quest voting: the phone goes to each person on the quest in turn. Only the number
 * of fail cards is kept, never who played what or in which order.
 */
export type QuestFlow =
  | { step: 'setup' }
  | { step: 'handoff'; size: QuestSize; index: number; fails: number }
  | { step: 'choose'; size: QuestSize; index: number; fails: number; order: [QuestCard, QuestCard] }
  | { step: 'collected'; size: QuestSize; fails: number }
  | { step: 'result'; size: QuestSize; fails: number }

export type QuestAction =
  | { type: 'start'; size: QuestSize }
  | { type: 'reveal'; order: [QuestCard, QuestCard] }
  | { type: 'play'; card: QuestCard }
  /** Back key or app in background: the same player starts over. */
  | { type: 'hide' }
  | { type: 'show' }
  | { type: 'reset' }

export const QUEST_IDLE: QuestFlow = { step: 'setup' }

export function questReducer(flow: QuestFlow, action: QuestAction): QuestFlow {
  switch (action.type) {
    case 'start':
      return isQuestSize(action.size)
        ? { step: 'handoff', size: action.size, index: 0, fails: 0 }
        : flow
    case 'reveal':
      return flow.step === 'handoff' ? { ...flow, step: 'choose', order: action.order } : flow
    case 'play': {
      if (flow.step !== 'choose') return flow
      const fails = flow.fails + (action.card === 'fail' ? 1 : 0)
      const next = flow.index + 1
      return next < flow.size
        ? { step: 'handoff', size: flow.size, index: next, fails }
        : { step: 'collected', size: flow.size, fails }
    }
    case 'hide':
      return flow.step === 'choose'
        ? { step: 'handoff', size: flow.size, index: flow.index, fails: flow.fails }
        : flow
    case 'show':
      return flow.step === 'collected' ? { ...flow, step: 'result' } : flow
    case 'reset':
      return QUEST_IDLE
  }
}

/** The played cards, successes first and then fails (e.g. ✓✓✗): order says nothing about who. */
export function playedCards(size: number, fails: number): QuestCard[] {
  return [
    ...Array<QuestCard>(size - fails).fill('success'),
    ...Array<QuestCard>(fails).fill('fail'),
  ]
}

/** 「任務成功」 when no one failed it, otherwise how many fail cards were played. */
export function resultText(fails: number): string {
  return fails === 0 ? '任務成功' : `${fails} 張失敗`
}
