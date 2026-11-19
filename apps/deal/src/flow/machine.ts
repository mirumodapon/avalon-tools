import type { SeatRole } from '@avalon/rules'

/** A fresh deal, or replaying a saved one so players can look at their cards again. */
export type FlowMode = 'deal' | 'replay'

/**
 * The pass-the-phone flow. Only the player currently looking has a role on screen:
 * `handoff` and `done` carry no role data that the UI could render.
 */
export type Flow =
  | { step: 'idle' }
  /** Waiting for the player in `table[index]` to take the phone. */
  | { step: 'handoff'; mode: FlowMode; recordId: string; table: SeatRole[]; index: number }
  /** That player's card is face up. */
  | { step: 'reveal'; mode: FlowMode; recordId: string; table: SeatRole[]; index: number }
  /** Everyone has seen their card; the table is dropped. */
  | { step: 'done'; mode: FlowMode; recordId: string }

export type FlowAction =
  | { type: 'start'; mode: FlowMode; recordId: string; table: SeatRole[] }
  | { type: 'reveal' }
  /** Card turned face down by the player (double tap): move on. */
  | { type: 'confirm' }
  /** Card hidden without confirming (back key, app in background): same player again. */
  | { type: 'hide' }
  | { type: 'reset' }

export const IDLE: Flow = { step: 'idle' }

export function flowReducer(flow: Flow, action: FlowAction): Flow {
  switch (action.type) {
    case 'start':
      return {
        step: 'handoff',
        mode: action.mode,
        recordId: action.recordId,
        table: action.table,
        index: 0,
      }
    case 'reveal':
      return flow.step === 'handoff' ? { ...flow, step: 'reveal' } : flow
    case 'confirm': {
      if (flow.step !== 'reveal') return flow
      const next = flow.index + 1
      return next < flow.table.length
        ? { ...flow, step: 'handoff', index: next }
        : { step: 'done', mode: flow.mode, recordId: flow.recordId }
    }
    case 'hide':
      return flow.step === 'reveal' ? { ...flow, step: 'handoff' } : flow
    case 'reset':
      return IDLE
  }
}

/** Some player still has to see their card (history stays locked meanwhile). */
export function isDealing(flow: Flow): flow is Extract<Flow, { step: 'handoff' | 'reveal' }> {
  return flow.step === 'handoff' || flow.step === 'reveal'
}
