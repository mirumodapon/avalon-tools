import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HOLD_MS } from '../hooks/useHold.ts'
import { QUEST_IDLE } from '../quest/quest.ts'
import { useQuest } from '../quest/store.ts'
import { DEFAULT_SETTINGS, useSettings } from '../settings.ts'
import { QuestPage } from './QuestPage.tsx'

const RECT = { left: 0, top: 0, right: 300, bottom: 400, width: 300, height: 400, x: 0, y: 0 }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    ...RECT,
    toJSON: () => RECT,
  })
  useQuest.setState({ flow: QUEST_IDLE, draft: { playerCount: null, questIndex: 0, team: [] } })
  useSettings.setState({ settings: { ...DEFAULT_SETTINGS, playerCount: 7 } })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const seat = (n: number) => screen.getByRole('button', { name: `${n} 號` })

function hold(label: string) {
  fireEvent.pointerDown(screen.getByRole('button', { name: label }), { clientX: 5, clientY: 5 })
  act(() => vi.advanceTimersByTime(HOLD_MS))
}

/** The two card buttons, top to bottom. */
const cardButtons = () => screen.getAllByRole('button', { name: /^任務(成功|失敗)$/ })

function play(card: '任務成功' | '任務失敗') {
  hold('長按出牌')
  fireEvent.click(screen.getByRole('button', { name: card }))
}

describe('QuestPage', () => {
  it('needs exactly the team size for the quest', () => {
    render(<QuestPage />)
    expect(screen.getByText('第 1 個任務需要 2 位隊員')).toBeTruthy()
    const start = screen.getByRole('button', { name: /開始出任務/ })
    fireEvent.click(seat(3))
    expect(start).toHaveProperty('disabled', true)
    expect(screen.getByText('還要選 1 位隊員')).toBeTruthy()
    fireEvent.click(seat(5))
    expect(start).toHaveProperty('disabled', false)
    fireEvent.click(seat(6))
    expect(screen.getByText('多選了 1 位，這個任務是 2 人')).toBeTruthy()
  })

  it('passes the phone to each member in seat order and shows the fail count', () => {
    render(<QuestPage />)
    fireEvent.click(screen.getByRole('radio', { name: '4' }))
    expect(screen.getByText(/要 2 張失敗才算失敗/)).toBeTruthy()
    for (const n of [6, 1, 4, 2]) fireEvent.click(seat(n))
    fireEvent.click(screen.getByRole('button', { name: /開始出任務/ }))

    const plays = ['任務失敗', '任務成功', '任務成功', '任務成功'] as const
    ;[1, 2, 4, 6].forEach((n, i) => {
      expect(screen.getByText(`${n} 號玩家`)).toBeTruthy()
      expect(screen.queryByRole('button', { name: /^任務(成功|失敗)$/ })).toBeNull()
      hold('長按出牌')
      expect(cardButtons()).toHaveLength(2)
      fireEvent.click(screen.getByRole('button', { name: plays[i] }))
    })

    expect(screen.getByText('所有隊員已出牌')).toBeTruthy()
    hold('長按公布結果')
    expect(screen.getByText('任務成功')).toBeTruthy()
    expect(screen.getByText('1 張失敗（這個任務需要 2 張失敗）')).toBeTruthy()
    const cards = within(screen.getByRole('list', { name: '出的牌' })).getAllByRole('listitem')
    expect(cards.map((c) => c.getAttribute('aria-label')).toSorted()).toEqual(
      ['任務失敗', '任務成功', '任務成功', '任務成功'].toSorted(),
    )
  })

  it('reports a failed quest with its fail count', () => {
    useQuest.setState({ draft: { playerCount: 5, questIndex: 0, team: [1, 2] } })
    render(<QuestPage />)
    fireEvent.click(screen.getByRole('button', { name: /開始出任務/ }))
    play('任務失敗')
    play('任務失敗')
    hold('長按公布結果')
    expect(screen.getByText('任務失敗')).toBeTruthy()
    expect(screen.getByText('2 張失敗')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '下一個任務' }))
    expect(useQuest.getState().draft).toMatchObject({ questIndex: 1, team: [] })
    expect(screen.getByText('第 2 個任務需要 3 位隊員')).toBeTruthy()
  })

  it('the back key puts the same player back without a card played', () => {
    useQuest.setState({ draft: { playerCount: 5, questIndex: 0, team: [1, 2] } })
    render(<QuestPage />)
    fireEvent.click(screen.getByRole('button', { name: /開始出任務/ }))
    hold('長按出牌')
    act(() => void window.dispatchEvent(new PopStateEvent('popstate')))
    expect(screen.getByText('1 號玩家')).toBeTruthy()
    expect(useQuest.getState().flow).toMatchObject({ step: 'handoff', index: 0, fails: 0 })
  })
})
