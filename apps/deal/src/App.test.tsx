import { ROLES } from '@avalon/rules'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App.tsx'
import { IGNORE_TAPS_MS } from './components/RoleCard.tsx'
import { IDLE } from './flow/machine.ts'
import { useFlow } from './flow/store.ts'
import { HOLD_MS } from './hooks/useHold.ts'
import { createLocalStore, listRecords, saveRecord, setRecordStore } from './history/store.ts'
import { DEFAULT_SETTINGS, useSettings } from './settings.ts'

const ROLE_NAMES = ROLES.map((r) => r.name)
const RECT = { left: 0, top: 0, right: 300, bottom: 400, width: 300, height: 400, x: 0, y: 0 }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance', 'Date'] })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    ...RECT,
    toJSON: () => RECT,
  })
  setRecordStore(createLocalStore())
  useFlow.setState({ flow: IDLE })
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

/** Visible text and hidden text alike: nothing about roles may sit in the DOM. */
const domText = () => document.body.innerHTML

async function startDeal() {
  await act(async () => fireEvent.click(screen.getByRole('button', { name: /開始發牌/ })))
}

function hold(label = '長按查看身分') {
  const card = screen.getByRole('button', { name: label })
  fireEvent.pointerDown(card, { pointerType: 'touch', clientX: 10, clientY: 10 })
  act(() => vi.advanceTimersByTime(HOLD_MS))
}

function doubleTap() {
  act(() => vi.advanceTimersByTime(IGNORE_TAPS_MS + 10))
  const card = screen.getByRole('button', { name: /雙擊蓋牌/ })
  fireEvent.click(card)
  act(() => vi.advanceTimersByTime(100))
  fireEvent.click(card)
}

describe('deal app', () => {
  it('starts on the setup page with a link home', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '角色發牌' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '回到阿瓦隆工具集' }).getAttribute('href')).toBe('/')
    expect(screen.getByText('好人 3')).toBeTruthy()
    expect(screen.getByText('壞人 2')).toBeTruthy()
  })

  it('passes the phone around: hold to reveal, double tap to cover, nothing left behind', async () => {
    render(<App />)
    await startDeal()
    expect((await listRecords()).length).toBe(1)

    for (let seat = 1; seat <= 5; seat++) {
      expect(screen.getByText(`${seat} 號玩家`)).toBeTruthy()
      expect(screen.getByRole('heading', { name: `第 ${seat} / 5 位` })).toBeTruthy()
      for (const name of ROLE_NAMES) expect(domText()).not.toContain(name)

      hold()
      expect(screen.getByText('確認後雙擊卡片蓋牌')).toBeTruthy()
      expect(ROLE_NAMES.some((n) => domText().includes(n))).toBe(true)

      // a single tap does nothing
      act(() => vi.advanceTimersByTime(IGNORE_TAPS_MS + 10))
      fireEvent.click(screen.getByRole('button', { name: /雙擊蓋牌/ }))
      act(() => vi.advanceTimersByTime(400))
      expect(screen.getByText('確認後雙擊卡片蓋牌')).toBeTruthy()

      doubleTap()
    }
    expect(screen.getByText('所有玩家已確認身分，遊戲開始！')).toBeTruthy()
    for (const name of ROLE_NAMES) expect(domText()).not.toContain(name)
  })

  it('ignores the tap that ends the hold', async () => {
    render(<App />)
    await startDeal()
    hold()
    const card = screen.getByRole('button', { name: /雙擊蓋牌/ })
    fireEvent.click(card)
    act(() => vi.advanceTimersByTime(100))
    fireEvent.click(card)
    expect(screen.getByText('確認後雙擊卡片蓋牌')).toBeTruthy()
  })

  it('covers the card when the app goes to the background', async () => {
    render(<App />)
    await startDeal()
    hold()
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    expect(screen.getByText('1 號玩家')).toBeTruthy()
    for (const name of ROLE_NAMES) expect(domText()).not.toContain(name)
  })

  it('turns the card face down on the back key instead of going back', async () => {
    render(<App />)
    await startDeal()
    hold()
    const depth = window.history.length
    act(() => void window.dispatchEvent(new PopStateEvent('popstate')))
    expect(screen.getByText('1 號玩家')).toBeTruthy()
    expect(screen.getByRole('button', { name: '長按查看身分' })).toBeTruthy()
    // a new entry absorbs the next back press too
    expect(window.history.length).toBeGreaterThan(depth)
  })

  it('keeps the history out of reach while dealing', async () => {
    render(<App />)
    await startDeal()
    expect(screen.queryByRole('button', { name: '歷史紀錄' })).toBeNull()
    act(() => {
      window.location.hash = '#/history'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.queryByRole('heading', { name: '歷史紀錄' })).toBeNull()
    expect(screen.getByText('1 號玩家')).toBeTruthy()
  })

  it('will not deal an impossible setup and says why', () => {
    useSettings.getState().update({ special: ['merlin', 'assassin', 'morgana', 'oberon'] })
    render(<App />)
    expect(screen.getByRole('button', { name: /開始發牌/ })).toHaveProperty('disabled', true)
    expect(screen.getByText('特殊壞人有 3 位，但 5 人只有 2 位壞人')).toBeTruthy()
  })

  it('asks before lowering the history limit drops records', async () => {
    useSettings.getState().update({ keep: 10 })
    for (let i = 0; i < 7; i++) {
      await saveRecord({ id: `r${i}`, createdAt: i, playerCount: 5, config: [], assignments: [] })
    }
    render(<App />)
    await act(async () => fireEvent.click(screen.getByRole('radio', { name: '3 筆' })))
    expect(screen.getByText('將刪除 4 筆舊紀錄。')).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '刪除並套用' })))
    expect(useSettings.getState().settings.keep).toBe(3)
    expect((await listRecords()).map((r) => r.id)).toEqual(['r6', 'r5', 'r4'])
  })
})
