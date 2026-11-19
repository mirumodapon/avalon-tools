import { describe, expect, it } from 'vitest'
import {
  eligibleTargets,
  LADY_IDLE,
  ladyReducer,
  loyaltyOrder,
  usesOf,
  type LadyAction,
  type LadyState,
} from './lady.ts'

const run = (actions: LadyAction[], from: LadyState = LADY_IDLE) =>
  actions.reduce(ladyReducer, from)
const use = (holder: number, target: number, loyalty: 'good' | 'evil' = 'good'): LadyAction[] => [
  { type: 'start', holder, target },
  { type: 'showChoices', order: ['good', 'evil'] },
  { type: 'declare', loyalty },
  { type: 'reveal' },
  { type: 'confirm' },
  { type: 'close' },
]

describe('lady', () => {
  it('goes to the target, back to the holder, then passes the Lady on', () => {
    const steps = [
      { type: 'start', holder: 7, target: 3 },
      { type: 'showChoices', order: ['evil', 'good'] },
      { type: 'declare', loyalty: 'evil' },
    ] as LadyAction[]
    expect(run(steps).flow).toEqual({ step: 'toHolder', holder: 7, target: 3, shown: 'evil' })
    const done = run([...steps, { type: 'reveal' }, { type: 'confirm' }])
    expect(done).toEqual({ holders: [7, 3], flow: { step: 'passed', holder: 7, target: 3 } })
  })

  it('only lets the current holder inspect, and never a former holder', () => {
    const after = run(use(7, 3))
    expect(after.holders).toEqual([7, 3])
    expect(ladyReducer(after, { type: 'start', holder: 7, target: 5 })).toBe(after)
    expect(ladyReducer(after, { type: 'start', holder: 3, target: 7 })).toBe(after)
    expect(ladyReducer(after, { type: 'start', holder: 3, target: 3 })).toBe(after)
    expect(ladyReducer(after, { type: 'start', holder: 3, target: 5 }).flow.step).toBe('toTarget')
  })

  it('lists who can be inspected', () => {
    expect(eligibleTargets(7, [], 7)).toEqual([1, 2, 3, 4, 5, 6])
    expect(eligibleTargets(7, [7, 3], 3)).toEqual([1, 2, 4, 5, 6])
  })

  it('stops after three uses', () => {
    const full = run([...use(7, 3), ...use(3, 5), ...use(5, 1)])
    expect(usesOf(full.holders)).toBe(3)
    expect(ladyReducer(full, { type: 'start', holder: 1, target: 2 })).toBe(full)
    expect(ladyReducer(full, { type: 'reset' })).toEqual(LADY_IDLE)
  })

  it('hiding puts the same person back to the start of their turn', () => {
    const declaring = run([
      { type: 'start', holder: 7, target: 3 },
      { type: 'showChoices', order: ['good', 'evil'] },
    ])
    expect(ladyReducer(declaring, { type: 'hide' }).flow).toEqual({
      step: 'toTarget',
      holder: 7,
      target: 3,
    })
    const revealed = run([{ type: 'declare', loyalty: 'good' }, { type: 'reveal' }], declaring)
    expect(ladyReducer(revealed, { type: 'hide' }).flow).toMatchObject({
      step: 'toHolder',
      shown: 'good',
    })
    expect(ladyReducer(revealed, { type: 'hide' }).holders).toEqual([])
  })

  it('puts the two choices in either order', () => {
    expect(loyaltyOrder(() => 0)).toEqual(['evil', 'good'])
    expect(loyaltyOrder(() => 1)).toEqual(['good', 'evil'])
  })
})
