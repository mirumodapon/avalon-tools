import { describe, expect, it } from 'vitest'
import { LADY_IDLE, ladyReducer, loyaltyOrder, type LadyAction, type LadyFlow } from './lady.ts'

const run = (actions: LadyAction[], from: LadyFlow = LADY_IDLE) => actions.reduce(ladyReducer, from)

describe('lady', () => {
  it('starts with no setup: target chooses, holder sees, nothing is kept', () => {
    const steps: LadyAction[] = [
      { type: 'start' },
      { type: 'showChoices', order: ['evil', 'good'] },
      { type: 'declare', loyalty: 'evil' },
    ]
    expect(run(steps)).toEqual({ step: 'toHolder', shown: 'evil' })
    expect(run([...steps, { type: 'reveal' }])).toEqual({ step: 'reveal', shown: 'evil' })
    expect(run([...steps, { type: 'reveal' }, { type: 'confirm' }])).toEqual({ step: 'passed' })
    expect(run([...steps, { type: 'reveal' }, { type: 'confirm' }, { type: 'close' }])).toEqual(
      LADY_IDLE,
    )
  })

  it('hiding puts the same person back to the start of their turn', () => {
    const declaring = run([{ type: 'start' }, { type: 'showChoices', order: ['good', 'evil'] }])
    expect(ladyReducer(declaring, { type: 'hide' })).toEqual({ step: 'toTarget' })
    const revealed = run([{ type: 'declare', loyalty: 'good' }, { type: 'reveal' }], declaring)
    expect(ladyReducer(revealed, { type: 'hide' })).toEqual({ step: 'toHolder', shown: 'good' })
  })

  it('ignores steps out of order', () => {
    expect(ladyReducer(LADY_IDLE, { type: 'reveal' })).toBe(LADY_IDLE)
    const t: LadyFlow = { step: 'toTarget' }
    expect(ladyReducer(t, { type: 'confirm' })).toBe(t)
  })

  it('puts the two choices in either order', () => {
    expect(loyaltyOrder(() => 0)).toEqual(['evil', 'good'])
    expect(loyaltyOrder(() => 1)).toEqual(['good', 'evil'])
  })
})
