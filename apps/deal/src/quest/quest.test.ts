import { describe, expect, it } from 'vitest'
import {
  cardOrder,
  checkTeam,
  playedCards,
  QUEST_IDLE,
  questReducer,
  resultText,
  type QuestAction,
  type QuestFlow,
  type QuestSetup,
} from './quest.ts'

const setup: QuestSetup = { playerCount: 7, team: [1, 3, 4, 6] }
const run = (...actions: QuestAction[]) => actions.reduce<QuestFlow>(questReducer, QUEST_IDLE)
const vote = (card: 'success' | 'fail'): QuestAction[] => [
  { type: 'reveal', order: ['fail', 'success'] },
  { type: 'play', card },
]

describe('checkTeam', () => {
  it('accepts any team size a quest can have at the table', () => {
    expect(checkTeam({ playerCount: 7, team: [1, 2] })).toMatchObject({
      ok: true,
      sizes: [2, 3, 4],
    })
    expect(checkTeam({ playerCount: 7, team: [1, 2, 3, 4] }).ok).toBe(true)
    expect(checkTeam({ playerCount: 10, team: [1, 2, 3, 4, 5] }).ok).toBe(true)
  })

  it('explains what is missing', () => {
    expect(checkTeam({ playerCount: 7, team: [] }).message).toBe('點選參與任務的號碼')
    expect(checkTeam({ playerCount: 7, team: [5] }).message).toBe(
      '7 人局的任務人數為 2、3、4 人（目前 1 人）',
    )
    expect(checkTeam({ playerCount: 5, team: [1, 2, 3, 4] }).ok).toBe(false)
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

  it('will not start with a team no quest has', () => {
    expect(run({ type: 'start', setup: { ...setup, team: [1] } })).toEqual(QUEST_IDLE)
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

describe('result', () => {
  it('says success or how many failed', () => {
    expect(resultText(0)).toBe('任務成功')
    expect(resultText(2)).toBe('2 張失敗')
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
