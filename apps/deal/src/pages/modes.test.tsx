import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App.tsx'
import { IDLE, LADY_IDLE, QUEST_IDLE } from '@avalon/pass-play'
import { useFlow } from '../flow/store.ts'
import { IGNORE_TAPS_MS } from '../hooks/useDoubleTap.ts'
import { HOLD_MS } from '../hooks/useHold.ts'
import { createLocalStore, listRecords, setRecordStore } from '../history/store.ts'
import { useLady } from '../lady/store.ts'
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
  useQuest.setState({ flow: QUEST_IDLE, size: 2 })
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

  it('keeps each mode to itself', () => {
    useSettings.getState().update({ playerCount: 9 })
    render(<App />)
    tab('出任務')
    fireEvent.click(within(screen.getByRole('tabpanel')).getByRole('radio', { name: '4 人' }))
    expect(useQuest.getState().size).toBe(4)
    expect(useSettings.getState().settings.playerCount).toBe(9)
  })
})

describe('出任務', () => {
  it('only needs how many go, passes the phone in turn and shows successes then fails', async () => {
    render(<App />)
    tab('出任務')
    expect(screen.queryByRole('button', { name: /^\d+ 號$/ })).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: '3 人' }))
    fireEvent.click(screen.getByRole('button', { name: /開始出任務/ }))

    for (const [n, card] of [
      [1, '任務失敗'],
      [2, '任務成功'],
      [3, '任務成功'],
    ] as const) {
      expect(screen.getByText(`第 ${n} 位出任務的玩家`)).toBeTruthy()
      expect(screen.getByRole('heading', { name: `出任務・第 ${n} / 3 位` })).toBeTruthy()
      expect(screen.queryByRole('button', { name: /^任務(成功|失敗)$/ })).toBeNull()
      hold('長按出牌')
      expect(screen.getAllByRole('button', { name: /^任務(成功|失敗)$/ })).toHaveLength(2)
      fireEvent.click(screen.getByRole('button', { name: card }))
    }
    hold('長按公布結果')
    expect(screen.getByText('1 張失敗')).toBeTruthy()
    await act(async () => {})
    expect(await listRecords()).toEqual([
      expect.objectContaining({
        kind: 'quest',
        size: 3,
        fails: 1,
        cards: ['fail', 'success', 'success'],
      }),
    ])
    const cards = within(screen.getByRole('list', { name: '出的牌' })).getAllByRole('listitem')
    expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual([
      '任務成功',
      '任務成功',
      '任務失敗',
    ])

    fireEvent.click(screen.getByRole('button', { name: '再出一次任務' }))
    expect(screen.getByText('第 1 位出任務的玩家')).toBeTruthy()
  })

  it('says 任務成功 when nobody failed it', () => {
    useSettings.getState().update({ tab: 'quest' })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /開始出任務/ }))
    for (let i = 0; i < 2; i++) {
      hold('長按出牌')
      fireEvent.click(screen.getByRole('button', { name: '任務成功' }))
    }
    hold('長按公布結果')
    expect(screen.getByText('任務成功', { selector: 'p' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '回到設定' }))
    expect(screen.getByRole('tab', { name: '出任務' }).getAttribute('aria-selected')).toBe('true')
  })

  it('the back key puts the same player back without a card played', () => {
    useSettings.getState().update({ tab: 'quest' })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /開始出任務/ }))
    hold('長按出牌')
    act(() => void window.dispatchEvent(new PopStateEvent('popstate')))
    expect(screen.getByText('第 1 位出任務的玩家')).toBeTruthy()
    expect(useQuest.getState().flow).toMatchObject({ step: 'handoff', index: 0, fails: 0 })
  })
})

describe('湖中女神', () => {
  it('starts straight away: the inspected player chooses, the holder looks', async () => {
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
    await act(async () => {})
    expect(await listRecords()).toEqual([expect.objectContaining({ kind: 'lady', shown: 'evil' })])
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

describe('history of every mode', () => {
  it('keeps quest and Lady results covered until held', async () => {
    const store = createLocalStore()
    setRecordStore(store)
    await store.save({
      id: 'q',
      createdAt: 2,
      kind: 'quest',
      size: 3,
      fails: 1,
      cards: ['success', 'fail', 'success'],
    })
    await store.save({ id: 'l', createdAt: 1, kind: 'lady', shown: 'good' })
    window.location.hash = '#/history'
    render(<App />)
    await act(async () => {})
    expect(screen.getByText('3 人出任務')).toBeTruthy()
    expect(screen.queryByText('1 張失敗')).toBeNull()
    expect(screen.queryByRole('list', { name: '出的牌' })).toBeNull()
    expect(screen.queryByText('好人')).toBeNull()

    act(() => fireEvent.click(screen.getAllByRole('button', { name: /檢視/ })[0]!))
    await act(async () => {})
    expect(window.location.hash).toBe('#/history/q')
    expect(screen.queryByText('1 張失敗')).toBeNull()
    hold('長按查看任務結果')
    expect(screen.getByText('1 張失敗')).toBeTruthy()
    expect(screen.getAllByRole('listitem').map((c) => c.getAttribute('aria-label'))).toEqual([
      '第 1 位：任務成功',
      '第 2 位：任務失敗',
      '第 3 位：任務成功',
    ])

    act(() => {
      window.location.hash = '#/history'
    })
    await act(async () => {})
    act(() => fireEvent.click(screen.getAllByRole('button', { name: /檢視/ })[1]!))
    await act(async () => {})
    expect(window.location.hash).toBe('#/history/l')
    expect(screen.queryByText('好人')).toBeNull()
    hold('長按查看湖中女神的結果')
    expect(screen.getByText('好人')).toBeTruthy()
  })
})
