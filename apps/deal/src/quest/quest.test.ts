import { describe, expect, it } from 'vitest'
import {
  cardOrder,
  playedCards,
  QUEST_IDLE,
  questReducer,
  resultText,
  type QuestAction,
  type QuestFlow,
} from './quest.ts'

const run = (...actions: QuestAction[]) => actions.reduce<QuestFlow>(questReducer, QUEST_IDLE)
const vote = (card: 'success' | 'fail'): QuestAction[] => [
  { type: 'reveal', order: ['fail', 'success'] },
  { type: 'play', card },
]

describe('questReducer', () => {
  it('collects one card from each person on the quest, keeping only the fail count', () => {
    const flow = run(
      { type: 'start', size: 4 },
      ...vote('success'),
      ...vote('fail'),
      ...vote('success'),
      ...vote('fail'),
    )
    expect(flow).toEqual({ step: 'collected', size: 4, fails: 2 })
    expect(questReducer(flow, { type: 'show' })).toEqual({ step: 'result', size: 4, fails: 2 })
  })

  it('only takes quest sizes 2–5', () => {
    expect(run({ type: 'start', size: 1 as never })).toEqual(QUEST_IDLE)
    expect(run({ type: 'start', size: 6 as never })).toEqual(QUEST_IDLE)
    expect(run({ type: 'start', size: 5 })).toMatchObject({ step: 'handoff', size: 5, index: 0 })
  })

  it('lets the same player start over when hidden', () => {
    const flow = run(
      { type: 'start', size: 3 },
      ...vote('fail'),
      { type: 'reveal', order: ['success', 'fail'] },
      { type: 'hide' },
    )
    expect(flow).toEqual({ step: 'handoff', size: 3, index: 1, fails: 1 })
  })
})

describe('result', () => {
  it('lays out successes first, then fails', () => {
    expect(playedCards(3, 1)).toEqual(['success', 'success', 'fail'])
    expect(playedCards(4, 0)).toEqual(['success', 'success', 'success', 'success'])
    expect(playedCards(2, 2)).toEqual(['fail', 'fail'])
  })

  it('says success or how many failed', () => {
    expect(resultText(0)).toBe('任務成功')
    expect(resultText(2)).toBe('2 張失敗')
  })
})

describe('cardOrder', () => {
  it('puts the buttons in either order', () => {
    expect(cardOrder(() => 0)).toEqual(['fail', 'success'])
    expect(cardOrder(() => 1)).toEqual(['success', 'fail'])
    const seen = new Set(Array.from({ length: 100 }, () => cardOrder().join()))
    expect(seen.size).toBe(2)
  })
})
