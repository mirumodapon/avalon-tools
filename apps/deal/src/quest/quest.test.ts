import { describe, expect, it } from 'vitest'
import {
  cardOrder,
  checkTeam,
  playedCards,
  QUEST_IDLE,
  questOutcome,
  questReducer,
  type QuestAction,
  type QuestFlow,
  type QuestSetup,
} from './quest.ts'

const setup: QuestSetup = { playerCount: 7, questIndex: 3, team: [1, 3, 4, 6] }
const run = (...actions: QuestAction[]) => actions.reduce<QuestFlow>(questReducer, QUEST_IDLE)
const vote = (card: 'success' | 'fail'): QuestAction[] => [
  { type: 'reveal', order: ['fail', 'success'] },
  { type: 'play', card },
]

describe('checkTeam', () => {
  it('uses the official team sizes', () => {
    expect(checkTeam({ playerCount: 5, questIndex: 0, team: [1, 2] })).toMatchObject({
      ok: true,
      size: 2,
    })
    expect(checkTeam({ playerCount: 10, questIndex: 4, team: [1, 2] })).toMatchObject({
      ok: false,
      size: 5,
      message: '還要選 3 位隊員',
    })
    expect(checkTeam({ playerCount: 5, questIndex: 0, team: [1, 2, 3] }).message).toBe(
      '多選了 1 位，這個任務是 2 人',
    )
  })

  it('knows the fourth quest needs two fails from 7 players', () => {
    expect(checkTeam(setup).failsRequired).toBe(2)
    expect(checkTeam({ playerCount: 6, questIndex: 3, team: [] }).failsRequired).toBe(1)
  })
})

describe('questReducer', () => {
  it('collects one card per team member, keeping only the fail count', () => {
    const flow = run(
      { type: 'start', setup },
      ...vote('success'),
      ...vote('fail'),
      ...vote('success'),
      ...vote('fail'),
    )
    expect(flow).toEqual({ step: 'collected', setup, fails: 2 })
  })

  it('will not start with the wrong team size', () => {
    expect(run({ type: 'start', setup: { ...setup, team: [1, 2] } })).toEqual(QUEST_IDLE)
  })

  it('lets the same player start over when hidden', () => {
    const flow = run(
      { type: 'start', setup },
      ...vote('fail'),
      { type: 'reveal', order: ['success', 'fail'] },
      { type: 'hide' },
    )
    expect(flow).toEqual({ step: 'handoff', setup, index: 1, fails: 1 })
  })

  it('shows the result once every card is in', () => {
    const collected = run(
      { type: 'start', setup },
      ...vote('fail'),
      ...vote('success'),
      ...vote('success'),
      ...vote('success'),
    )
    const shown = questReducer(collected, {
      type: 'show',
      cards: ['success', 'fail', 'success', 'success'],
    })
    expect(shown).toMatchObject({ step: 'result', fails: 1 })
  })
})

describe('outcome', () => {
  it('needs two fails on the fourth quest from 7 players', () => {
    expect(questOutcome(setup, 1)).toEqual({ succeeded: true, failsRequired: 2 })
    expect(questOutcome(setup, 2)).toEqual({ succeeded: false, failsRequired: 2 })
    expect(questOutcome({ ...setup, questIndex: 0 }, 1).succeeded).toBe(false)
  })

  it('lays out the played cards', () => {
    expect(playedCards(4, 1).toSorted()).toEqual(['fail', 'success', 'success', 'success'])
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
