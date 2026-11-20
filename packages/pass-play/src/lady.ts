import type { Faction } from '@avalon/rules'
import { shuffle } from './shuffle.ts'

/** What the inspected player chooses to show; on their honour, like the loyalty card. */
export type Loyalty = Faction

export function loyaltyOrder(randomInt?: (max: number) => number): [Loyalty, Loyalty] {
  return shuffle(['good', 'evil'] as Loyalty[], randomInt) as [Loyalty, Loyalty]
}

/**
 * One use of the Lady, with no setup: the inspected player chooses what to show,
 * then passes the phone to the holder, who alone sees it.
 */
export type LadyFlow =
  | { step: 'idle' }
  | { step: 'toTarget' }
  | { step: 'declare'; order: [Loyalty, Loyalty] }
  | { step: 'toHolder'; shown: Loyalty }
  | { step: 'reveal'; shown: Loyalty }
  /** The holder has seen it; nothing about the choice is kept. */
  | { step: 'passed' }

export type LadyAction =
  | { type: 'start' }
  | { type: 'showChoices'; order: [Loyalty, Loyalty] }
  | { type: 'declare'; loyalty: Loyalty }
  | { type: 'reveal' }
  /** Back key or app in background: the current person starts over. */
  | { type: 'hide' }
  | { type: 'confirm' }
  | { type: 'close' }

export const LADY_IDLE: LadyFlow = { step: 'idle' }

export function ladyReducer(flow: LadyFlow, action: LadyAction): LadyFlow {
  switch (action.type) {
    case 'start':
      return { step: 'toTarget' }
    case 'showChoices':
      return flow.step === 'toTarget' ? { step: 'declare', order: action.order } : flow
    case 'declare':
      return flow.step === 'declare' ? { step: 'toHolder', shown: action.loyalty } : flow
    case 'reveal':
      return flow.step === 'toHolder' ? { step: 'reveal', shown: flow.shown } : flow
    case 'hide':
      if (flow.step === 'declare') return { step: 'toTarget' }
      if (flow.step === 'reveal') return { step: 'toHolder', shown: flow.shown }
      return flow
    case 'confirm':
      return flow.step === 'reveal' ? { step: 'passed' } : flow
    case 'close':
      return LADY_IDLE
  }
}

/** Someone is in the middle of a Lady use (the guard and other screens stay off). */
export function isLadyActive(flow: LadyFlow): boolean {
  return flow.step !== 'idle'
}
