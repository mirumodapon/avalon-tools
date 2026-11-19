import type { Faction } from '@avalon/rules'
import { shuffle } from '../deal/shuffle.ts'

/** The Lady of the Lake is used after quests 2, 3 and 4. */
export const MAX_LADY_USES = 3

/** What the inspected player chooses to show; on their honour, like the loyalty card. */
export type Loyalty = Faction

export function loyaltyOrder(randomInt?: (max: number) => number): [Loyalty, Loyalty] {
  return shuffle(['good', 'evil'] as Loyalty[], randomInt) as [Loyalty, Loyalty]
}

/**
 * One use of the Lady. The holder picks someone; the phone goes to them to choose
 * what to show, then back to the holder, who alone sees it. The Lady then passes on.
 */
export type LadyFlow =
  | { step: 'setup' }
  | { step: 'toTarget'; holder: number; target: number }
  | { step: 'declare'; holder: number; target: number; order: [Loyalty, Loyalty] }
  | { step: 'toHolder'; holder: number; target: number; shown: Loyalty }
  | { step: 'reveal'; holder: number; target: number; shown: Loyalty }
  | { step: 'passed'; holder: number; target: number }

export interface LadyState {
  /** Everyone who has held the Lady this game, in order; the last one holds it now. */
  holders: number[]
  flow: LadyFlow
}

export type LadyAction =
  | { type: 'start'; holder: number; target: number }
  | { type: 'showChoices'; order: [Loyalty, Loyalty] }
  | { type: 'declare'; loyalty: Loyalty }
  | { type: 'reveal' }
  /** Back key or app in background: the current person starts over. */
  | { type: 'hide' }
  /** The holder has seen it: the Lady passes to the inspected player. */
  | { type: 'confirm' }
  /** Back to choosing (after a use, or to abandon one). */
  | { type: 'close' }
  /** New game: forget who held the Lady. */
  | { type: 'reset' }

export const LADY_IDLE: LadyState = { holders: [], flow: { step: 'setup' } }

export function usesOf(holders: readonly number[]): number {
  return Math.max(0, holders.length - 1)
}

/** Seats the holder may inspect: not themselves and no one who has held the Lady. */
export function eligibleTargets(
  playerCount: number,
  holders: readonly number[],
  holder: number,
): number[] {
  const out: number[] = []
  for (let seat = 1; seat <= playerCount; seat++) {
    if (seat !== holder && !holders.includes(seat)) out.push(seat)
  }
  return out
}

export function ladyReducer(state: LadyState, action: LadyAction): LadyState {
  const { flow } = state
  const to = (next: LadyFlow): LadyState => ({ ...state, flow: next })
  switch (action.type) {
    case 'start': {
      const { holder, target } = action
      const current = state.holders.at(-1)
      if (current !== undefined && holder !== current) return state
      if (usesOf(state.holders) >= MAX_LADY_USES) return state
      if (target === holder || state.holders.includes(target)) return state
      return to({ step: 'toTarget', holder, target })
    }
    case 'showChoices':
      return flow.step === 'toTarget'
        ? to({ ...flow, step: 'declare', order: action.order })
        : state
    case 'declare':
      return flow.step === 'declare'
        ? to({ step: 'toHolder', holder: flow.holder, target: flow.target, shown: action.loyalty })
        : state
    case 'reveal':
      return flow.step === 'toHolder' ? to({ ...flow, step: 'reveal' }) : state
    case 'hide':
      if (flow.step === 'declare')
        return to({ step: 'toTarget', holder: flow.holder, target: flow.target })
      if (flow.step === 'reveal') return to({ ...flow, step: 'toHolder' })
      return state
    case 'confirm': {
      if (flow.step !== 'reveal') return state
      const holders = state.holders.length
        ? [...state.holders, flow.target]
        : [flow.holder, flow.target]
      return { holders, flow: { step: 'passed', holder: flow.holder, target: flow.target } }
    }
    case 'close':
      return to({ step: 'setup' })
    case 'reset':
      return LADY_IDLE
  }
}
