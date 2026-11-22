import { ROLES } from '@avalon/rules'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App.tsx'
import { IGNORE_TAPS_MS, IDLE, HOLD_MS } from '@avalon/pass-play'
import { useFlow } from './flow/store.ts'
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

/** Lets pending storage promises settle (the timers are fake, so findBy* would hang). */
const settle = () => act(async () => {})

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
    const help = screen.getByRole('link', { name: '使用說明' })
    expect(help.getAttribute('href')).toBe('/docs/guide/dealer/')
    expect(help.getAttribute('target')).toBe('_blank')
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
      expect(screen.getByText('確認後雙擊畫面蓋牌')).toBeTruthy()
      expect(ROLE_NAMES.some((n) => domText().includes(n))).toBe(true)

      // a single tap does nothing
      act(() => vi.advanceTimersByTime(IGNORE_TAPS_MS + 10))
      fireEvent.click(screen.getByRole('button', { name: /雙擊蓋牌/ }))
      act(() => vi.advanceTimersByTime(400))
      expect(screen.getByText('確認後雙擊畫面蓋牌')).toBeTruthy()

      doubleTap()
    }
    expect(screen.getByText('所有玩家已確認身分，遊戲開始！')).toBeTruthy()
    for (const name of ROLE_NAMES) expect(domText()).not.toContain(name)
    // straight back to the setup, no confirmation
    fireEvent.click(screen.getByRole('button', { name: '回到設定' }))
    expect(screen.getByRole('button', { name: /開始發牌/ })).toBeTruthy()
  })

  it('ignores the tap that ends the hold', async () => {
    render(<App />)
    await startDeal()
    hold()
    const card = screen.getByRole('button', { name: /雙擊蓋牌/ })
    fireEvent.click(card)
    act(() => vi.advanceTimersByTime(100))
    fireEvent.click(card)
    expect(screen.getByText('確認後雙擊畫面蓋牌')).toBeTruthy()
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

  it('switches on the usual roles when the player count changes', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: '6' }))
    expect(useSettings.getState().settings.special).toEqual([
      'merlin',
      'percival',
      'assassin',
      'morgana',
    ])
    expect(screen.getByRole('switch', { name: /莫甘娜/ })).toHaveProperty('checked', true)
    fireEvent.click(screen.getByRole('switch', { name: /莫甘娜/ }))
    expect(useSettings.getState().settings.special).not.toContain('morgana')
    fireEvent.click(screen.getByRole('radio', { name: '10' }))
    expect(useSettings.getState().settings.special).toHaveLength(6)
  })

  it('will not deal an impossible setup and says why', () => {
    useSettings.getState().update({ special: ['merlin', 'assassin', 'morgana', 'oberon'] })
    render(<App />)
    expect(screen.getByRole('button', { name: /開始發牌/ })).toHaveProperty('disabled', true)
    expect(screen.getByText('特殊壞人有 3 位，但 5 人只有 2 位壞人')).toBeTruthy()
  })

  it('keeps only the newest 50 records', async () => {
    for (let i = 0; i < 50; i++) {
      await saveRecord({
        id: `old${i}`,
        createdAt: i,
        kind: 'roles' as const,
        playerCount: 5,
        config: [],
        assignments: [],
      })
    }
    render(<App />)
    await startDeal()
    const ids = (await listRecords()).map((r) => r.id)
    expect(ids).toHaveLength(50)
    expect(ids).not.toContain('old0')
    expect(ids).toContain('old1')
    expect(screen.queryByText(/保留筆數/)).toBeNull()
  })

  it('replays a saved deal seat by seat without saving a new one', async () => {
    const assignments = [
      { seat: 1, role: 'assassin' as const },
      { seat: 2, role: 'merlin' as const },
      { seat: 3, role: 'loyal' as const },
      { seat: 4, role: 'minion' as const },
      { seat: 5, role: 'loyal' as const },
    ]
    await saveRecord({
      id: 'past',
      createdAt: Date.now(),
      kind: 'roles' as const,
      playerCount: 5,
      config: ['merlin', 'assassin'],
      assignments,
    })
    window.location.hash = '#/history'
    render(<App />)
    await settle()
    const replay = screen.getByRole('button', { name: /回放/ })
    expect(screen.getByRole('button', { name: /檢視/ })).toBeTruthy()
    act(() => fireEvent.click(replay))

    expect(screen.getByRole('heading', { name: '回放・第 1 / 5 位' })).toBeTruthy()
    for (const name of ROLE_NAMES) expect(domText()).not.toContain(name)
    hold()
    expect(screen.getByRole('button', { name: /刺客/ })).toBeTruthy()
    expect(screen.getByText('壞人隊友：4 號')).toBeTruthy()
    doubleTap()
    hold()
    expect(screen.getByText('壞人：1、4 號')).toBeTruthy()
    doubleTap()
    for (let i = 3; i <= 5; i++) {
      hold()
      doubleTap()
    }
    expect(screen.getByText('所有玩家已重新查看身分')).toBeTruthy()
    expect((await listRecords()).map((r) => r.id)).toEqual(['past'])
    act(() => fireEvent.click(screen.getByRole('button', { name: '回到歷史紀錄' })))
    await settle()
    expect(screen.getByRole('heading', { name: '歷史紀錄' })).toBeTruthy()
  })

  it('opens 檢視 for a saved deal', async () => {
    await saveRecord({
      id: 'past',
      createdAt: Date.now(),
      kind: 'roles' as const,
      playerCount: 5,
      config: [],
      assignments: [],
    })
    window.location.hash = '#/history'
    render(<App />)
    await settle()
    act(() => fireEvent.click(screen.getByRole('button', { name: /檢視/ })))
    expect(window.location.hash).toBe('#/history/past')
  })
})
