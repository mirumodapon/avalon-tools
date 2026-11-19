import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HOLD_MS } from '../hooks/useHold.ts'
import { IGNORE_TAPS_MS } from '../hooks/useDoubleTap.ts'
import { LADY_IDLE } from '../lady/lady.ts'
import { useLady } from '../lady/store.ts'
import { DEFAULT_SETTINGS, useSettings } from '../settings.ts'
import { LadyPage } from './LadyPage.tsx'

const RECT = { left: 0, top: 0, right: 300, bottom: 400, width: 300, height: 400, x: 0, y: 0 }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    ...RECT,
    toJSON: () => RECT,
  })
  useLady.setState({ state: LADY_IDLE, playerCount: null })
  useSettings.setState({ settings: { ...DEFAULT_SETTINGS, playerCount: 7 } })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const pick = (group: string, seat: number) =>
  fireEvent.click(
    screen.getByRole('group', { name: group }).querySelector(`[aria-label="${seat} 號"]`)!,
  )

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

function inspect(target: number, show: '好人' | '壞人') {
  pick('查驗對象', target)
  fireEvent.click(screen.getByRole('button', { name: `查驗 ${target} 號` }))
  expect(screen.getByText(`${target} 號玩家`)).toBeTruthy()
  hold('長按選擇要亮出的身分')
  fireEvent.click(screen.getByRole('button', { name: show }))
  // back with the holder: nothing about the choice is on screen yet
  expect(screen.queryByText(/亮出/)).toBeNull()
  hold(/^長按查看 \d+ 號的身分$/)
  expect(screen.getByRole('button', { name: new RegExp(`${target} 號亮出${show}`) })).toBeTruthy()
  doubleTap(/雙擊蓋上/)
}

describe('LadyPage', () => {
  it('goes from holder to target and back, then hands the Lady over', () => {
    render(<LadyPage />)
    pick('持有者', 7)
    inspect(3, '壞人')
    expect(screen.getByText('湖中女神交給 3 號')).toBeTruthy()
    expect(screen.getByText('已使用 1 / 3 次')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '下一次湖中女神' }))
    expect(screen.getByText('3 號')).toBeTruthy()
    const targets = screen.getByRole('group', { name: '查驗對象' })
    expect(targets.querySelector('[aria-label="7 號"]')).toHaveProperty('disabled', true)
    expect(targets.querySelector('[aria-label="3 號"]')).toHaveProperty('disabled', true)
    expect(targets.querySelector('[aria-label="5 號"]')).toHaveProperty('disabled', false)
  })

  it('stops after three uses', () => {
    render(<LadyPage />)
    pick('持有者', 7)
    inspect(3, '好人')
    fireEvent.click(screen.getByRole('button', { name: '下一次湖中女神' }))
    inspect(5, '壞人')
    fireEvent.click(screen.getByRole('button', { name: '下一次湖中女神' }))
    inspect(1, '好人')
    expect(screen.getByText('已使用 3 / 3 次')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '回到湖中女神' }))
    expect(screen.getByText('這一局的湖中女神已經用完 3 次')).toBeTruthy()
    expect(screen.queryByRole('group', { name: '查驗對象' })).toBeNull()
  })

  it('leaving the app sends the inspected player back to choosing', () => {
    render(<LadyPage />)
    pick('持有者', 2)
    pick('查驗對象', 4)
    fireEvent.click(screen.getByRole('button', { name: '查驗 4 號' }))
    hold('長按選擇要亮出的身分')
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    expect(screen.queryByRole('button', { name: '好人' })).toBeNull()
    expect(useLady.getState().state.flow).toEqual({ step: 'toTarget', holder: 2, target: 4 })
  })
})
