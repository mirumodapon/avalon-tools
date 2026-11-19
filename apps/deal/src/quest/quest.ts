import { teamSizes, type PlayerCount } from '@avalon/rules'
import { shuffle } from '../deal/shuffle.ts'

export type QuestCard = 'success' | 'fail'

export interface QuestSetup {
  playerCount: PlayerCount
  /** Team seats, ascending. */
  team: number[]
}

export interface TeamCheck {
  ok: boolean
  /** Team sizes the rules allow for this player count, ascending. */
  sizes: number[]
  /** Why the quest cannot start yet. */
  message: string | null
}

/** A team must have one of the sizes a quest can have at this table. */
export function checkTeam({ playerCount, team }: QuestSetup): TeamCheck {
  const sizes = [...new Set(teamSizes(playerCount))].toSorted((a, b) => a - b)
  const ok = sizes.includes(team.length)
  const message = ok
    ? null
    : team.length === 0
      ? '點選參與任務的號碼'
      : `${playerCount} 人局的任務人數為 ${sizes.join('、')} 人（目前 ${team.length} 人）`
  return { ok, sizes, message }
}

/** The two buttons in a random order, so where someone taps gives nothing away. */
export function cardOrder(randomInt?: (max: number) => number): [QuestCard, QuestCard] {
  return shuffle(['success', 'fail'] as QuestCard[], randomInt) as [QuestCard, QuestCard]
}

/**
 * Quest voting. Only the number of fail cards is kept, never who played what or in
 * which order.
 */
export type QuestFlow =
  | { step: 'setup' }
  | { step: 'handoff'; setup: QuestSetup; index: number; fails: number }
  | {
      step: 'choose'
      setup: QuestSetup
      index: number
      fails: number
      order: [QuestCard, QuestCard]
    }
  | { step: 'collected'; setup: QuestSetup; fails: number }
  | { step: 'result'; setup: QuestSetup; fails: number; cards: QuestCard[] }

export type QuestAction =
  | { type: 'start'; setup: QuestSetup }
  | { type: 'reveal'; order: [QuestCard, QuestCard] }
  | { type: 'play'; card: QuestCard }
  /** Back key or app in background: the same player starts over. */
  | { type: 'hide' }
  /** Shows the cards, already shuffled by the caller. */
  | { type: 'show'; cards: QuestCard[] }
  | { type: 'reset' }

export const QUEST_IDLE: QuestFlow = { step: 'setup' }

export function questReducer(flow: QuestFlow, action: QuestAction): QuestFlow {
  switch (action.type) {
    case 'start':
      if (!checkTeam(action.setup).ok) return flow
      return { step: 'handoff', setup: action.setup, index: 0, fails: 0 }
    case 'reveal':
      return flow.step === 'handoff' ? { ...flow, step: 'choose', order: action.order } : flow
    case 'play': {
      if (flow.step !== 'choose') return flow
      const fails = flow.fails + (action.card === 'fail' ? 1 : 0)
      const next = flow.index + 1
      return next < flow.setup.team.length
        ? { step: 'handoff', setup: flow.setup, index: next, fails }
        : { step: 'collected', setup: flow.setup, fails }
    }
    case 'hide':
      return flow.step === 'choose'
        ? { step: 'handoff', setup: flow.setup, index: flow.index, fails: flow.fails }
        : flow
    case 'show':
      return flow.step === 'collected' ? { ...flow, step: 'result', cards: action.cards } : flow
    case 'reset':
      return QUEST_IDLE
  }
}

/** The played cards as a set to lay out: `fails` fail cards among the team's cards. */
export function playedCards(size: number, fails: number): QuestCard[] {
  return [
    ...Array<QuestCard>(fails).fill('fail'),
    ...Array<QuestCard>(size - fails).fill('success'),
  ]
}

/** 「任務成功」 when no one failed it, otherwise how many fail cards were played. */
export function resultText(fails: number): string {
  return fails === 0 ? '任務成功' : `${fails} 張失敗`
}
