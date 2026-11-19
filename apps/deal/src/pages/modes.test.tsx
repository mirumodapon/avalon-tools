import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App.tsx'
import { IDLE } from '../flow/machine.ts'
import { useFlow } from '../flow/store.ts'
import { IGNORE_TAPS_MS } from '../hooks/useDoubleTap.ts'
import { HOLD_MS } from '../hooks/useHold.ts'
import { createLocalStore, setRecordStore } from '../history/store.ts'
import { LADY_IDLE } from '../lady/lady.ts'
import { useLady } from '../lady/store.ts'
import { QUEST_IDLE } from '../quest/quest.ts'
import { useQuest } from '../quest/store.ts'
import { DEFAULT_SETTINGS, useSettings } from '../settings.ts'

const RECT = { left: 0, top: 0, right: 300, bottom: 400, width: 300, height: 400, x: 0, y: 0 }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    ...RECT,
    toJSON: () => RECT,
  })
  setRecordStore(createLocalStore())
  useFlow.setState({ flow: IDLE })
  useQuest.setState({ flow: QUEST_IDLE, draft: { playerCount: 5, team: [] } })
  useLady.setState({ flow: LADY_IDLE })
  useSettings.setState({
    settings: { ...DEFAULT_SETTINGS, special: [...DEFAULT_SETTINGS.special] },
  })
  window.location.hash = '#/'
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  setRecordStore(null)
})

const seat = (n: number) => screen.getByRole('button', { name: `${n} 號` })
const tab = (name: string) => fireEvent.click(screen.getByRole('tab', { name }))

function hold(label: RegExp | string) {
  fireEvent.pointerDown(screen.getByRole('button', { name: label }), { clientX: 5, clientY: 5 })
  act(() => vi.advanceTimersByTime(HOLD_MS))
}

function doubleTap(label: RegExp) {
  act(() => vi.advanceTimersByTime(IGNORE_TAPS_MS + 10))
  const card = screen.getByRole('button', { name: label })
  fireEvent.click(card)
  act(() => vi.advanceTimersByTime(100))
  fireEvent.click(card)
}

describe('setup tabs', () => {
  it('separates the three modes and remembers the last one', () => {
    render(<App />)
    expect(screen.getByRole('tab', { name: '發角色' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('button', { name: /開始發牌/ })).toBeTruthy()

    tab('出任務')
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe('tab-quest')
    expect(screen.queryByText('梅林')).toBeNull()
    expect(screen.getByRole('button', { name: /開始出任務/ })).toBeTruthy()

    tab('湖中女神')
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.getByRole('button', { name: /開始湖中女神/ })).toBeTruthy()
    expect(useSettings.getState().settings.tab).toBe('lady')
  })

  it('keeps each mode to itself: the quest has its own player count', () => {
    useSettings.getState().update({ playerCount: 9 })
    render(<App />)
    tab('出任務')
    const quest = screen.getByRole('tabpanel')
    expect(within(quest).getByRole('radio', { name: '5' })).toHaveProperty('checked', true)
    fireEvent.click(within(quest).getByRole('radio', { name: '7' }))
    expect(useSettings.getState().settings.playerCount).toBe(9)
  })
})

describe('出任務', () => {
  it('only needs the player count and the members, then shows the fail count', () => {
    render(<App />)
    tab('出任務')
    const start = screen.getByRole('button', { name: /開始出任務/ })
    expect(screen.getByText('任務人數：2、3 人')).toBeTruthy()
    fireEvent.click(seat(4))
    expect(start).toHaveProperty('disabled', true)
    expect(screen.getByText('5 人局的任務人數為 2、3 人（目前 1 人）')).toBeTruthy()
    fireEvent.click(seat(2))
    fireEvent.click(seat(5))
    fireEvent.click(start)

    for (const [n, card] of [
      [2, '任務成功'],
      [4, '任務失敗'],
      [5, '任務失敗'],
    ] as const) {
      expect(screen.getByText(`${n} 號玩家`)).toBeTruthy()
      expect(screen.queryByRole('button', { name: /^任務(成功|失敗)$/ })).toBeNull()
      hold('長按出牌')
      expect(screen.getAllByRole('button', { name: /^任務(成功|失敗)$/ })).toHaveLength(2)
      fireEvent.click(screen.getByRole('button', { name: card }))
    }
    hold('長按公布結果')
    expect(screen.getByText('2 張失敗')).toBeTruthy()
    const cards = within(screen.getByRole('list', { name: '出的牌' })).getAllByRole('listitem')
    expect(cards.map((c) => c.getAttribute('aria-label')).toSorted()).toEqual(
      ['任務失敗', '任務失敗', '任務成功'].toSorted(),
    )

    fireEvent.click(screen.getByRole('button', { name: '再出一次任務' }))
    expect(screen.getByRole('tab', { name: '出任務' }).getAttribute('aria-selected')).toBe('true')
    expect(useQuest.getState().draft.team).toEqual([])
  })

  it('says 任務成功 when nobody failed it', () => {
    useQuest.setState({ draft: { playerCount: 5, team: [1, 3] } })
    useSettings.getState().update({ tab: 'quest' })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /開始出任務/ }))
    for (let i = 0; i < 2; i++) {
      hold('長按出牌')
      fireEvent.click(screen.getByRole('button', { name: '任務成功' }))
    }
    hold('長按公布結果')
    expect(screen.getByText('任務成功', { selector: 'p' })).toBeTruthy()
  })

  it('the back key puts the same member back without a card played', () => {
    useQuest.setState({ draft: { playerCount: 5, team: [1, 2] } })
    useSettings.getState().update({ tab: 'quest' })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /開始出任務/ }))
    hold('長按出牌')
    act(() => void window.dispatchEvent(new PopStateEvent('popstate')))
    expect(screen.getByText('1 號玩家')).toBeTruthy()
    expect(useQuest.getState().flow).toMatchObject({ step: 'handoff', index: 0, fails: 0 })
  })
})

describe('湖中女神', () => {
  it('starts straight away: the inspected player chooses, the holder looks', () => {
    useSettings.getState().update({ tab: 'lady' })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /開始湖中女神/ }))
    expect(screen.getByText('被查驗的玩家')).toBeTruthy()
    hold('長按選擇要亮出的身分')
    fireEvent.click(screen.getByRole('button', { name: '壞人' }))
    expect(screen.getByText('湖中女神持有者')).toBeTruthy()
    expect(screen.queryByText(/亮出/)).toBeNull()
    hold('長按查看對方的身分')
    expect(screen.getByRole('button', { name: /亮出壞人/ })).toBeTruthy()
    doubleTap(/雙擊蓋上/)
    expect(screen.getByText('湖中女神交給被查驗的玩家')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '再查驗一次' }))
    expect(screen.getByText('被查驗的玩家')).toBeTruthy()
  })

  it('leaving the app sends the inspected player back to choosing', () => {
    useLady.setState({ flow: { step: 'declare', order: ['good', 'evil'] } })
    render(<App />)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    expect(screen.queryByRole('button', { name: '好人' })).toBeNull()
    expect(useLady.getState().flow).toEqual({ step: 'toTarget' })
  })
})
