import type { SeatRole } from '@avalon/rules'
import { describe, expect, it } from 'vitest'
import { flowReducer, IDLE, isDealing, type Flow, type FlowAction } from './machine.ts'

const table: SeatRole[] = [
  { seat: 1, role: 'merlin' },
  { seat: 2, role: 'assassin' },
  { seat: 3, role: 'loyal' },
]
const run = (...actions: FlowAction[]) => actions.reduce<Flow>(flowReducer, IDLE)

describe('flowReducer', () => {
  it('goes through every player and ends without the table', () => {
    const start: FlowAction = { type: 'start', recordId: 'r', table }
    expect(run(start)).toMatchObject({ step: 'handoff', index: 0 })
    expect(run(start, { type: 'reveal' })).toMatchObject({ step: 'reveal', index: 0 })
    expect(run(start, { type: 'reveal' }, { type: 'confirm' })).toMatchObject({
      step: 'handoff',
      index: 1,
    })
    const done = run(
      start,
      ...Array.from({ length: 3 }, (): FlowAction[] => [
        { type: 'reveal' },
        { type: 'confirm' },
      ]).flat(),
    )
    expect(done).toEqual({ step: 'done', recordId: 'r' })
    expect(isDealing(done)).toBe(false)
  })

  it('hiding a card keeps the same player', () => {
    const f = run({ type: 'start', recordId: 'r', table }, { type: 'reveal' }, { type: 'hide' })
    expect(f).toMatchObject({ step: 'handoff', index: 0 })
    expect(isDealing(f)).toBe(true)
  })

  it('ignores actions that do not fit the step', () => {
    const handoff = run({ type: 'start', recordId: 'r', table })
    expect(flowReducer(handoff, { type: 'confirm' })).toBe(handoff)
    expect(flowReducer(handoff, { type: 'hide' })).toBe(handoff)
    expect(flowReducer(IDLE, { type: 'reveal' })).toBe(IDLE)
  })
})
