import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HOLD_MS, useHold } from './useHold.ts'

function Holder({ onDone }: { onDone: () => void }) {
  const { holding, handlers } = useHold(onDone)
  return (
    <div data-testid="card" data-holding={holding} {...handlers}>
      卡
    </div>
  )
}

const RECT = { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0 }

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    ...RECT,
    toJSON: () => RECT,
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function setup() {
  const onDone = vi.fn<() => void>()
  render(<Holder onDone={onDone} />)
  return { onDone, card: screen.getByTestId('card') }
}

describe('useHold', () => {
  it('fires after holding for the full time', () => {
    const { onDone, card } = setup()
    fireEvent.pointerDown(card, { pointerType: 'touch', clientX: 50, clientY: 50 })
    expect(card.dataset.holding).toBe('true')
    act(() => vi.advanceTimersByTime(HOLD_MS - 1))
    expect(onDone).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('resets when released early', () => {
    const { onDone, card } = setup()
    fireEvent.pointerDown(card, { pointerType: 'touch', clientX: 50, clientY: 50 })
    act(() => vi.advanceTimersByTime(HOLD_MS - 100))
    fireEvent.pointerUp(card)
    expect(card.dataset.holding).toBe('false')
    act(() => vi.advanceTimersByTime(HOLD_MS))
    expect(onDone).not.toHaveBeenCalled()
  })

  it('treats sliding off the card as letting go', () => {
    const { onDone, card } = setup()
    fireEvent.pointerDown(card, { pointerType: 'touch', clientX: 50, clientY: 50 })
    fireEvent.pointerMove(card, { pointerType: 'touch', clientX: 50, clientY: 140 })
    act(() => vi.advanceTimersByTime(HOLD_MS))
    expect(onDone).not.toHaveBeenCalled()
  })

  it('blocks the long-press menu', () => {
    const { card } = setup()
    const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    card.dispatchEvent(menu)
    expect(menu.defaultPrevented).toBe(true)
  })
})
