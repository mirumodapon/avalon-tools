import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOUBLE_TAP_MS, IGNORE_TAPS_MS, useDoubleTap } from './useDoubleTap.ts'

function Card({ onCover }: { onCover: () => void }) {
  const tap = useDoubleTap(onCover)
  return (
    <div>
      <p>說明文字</p>
      <button type="button" onClick={tap}>
        卡
      </button>
    </div>
  )
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
})
afterEach(() => {
  vi.useRealTimers()
})

function setup() {
  const onCover = vi.fn<() => void>()
  render(<Card onCover={onCover} />)
  act(() => vi.advanceTimersByTime(IGNORE_TAPS_MS + 10))
  return onCover
}

function tapAt(el: Element) {
  fireEvent.pointerDown(el, { isPrimary: true })
  // A pointer tap also clicks; `detail` 1 marks it as coming from the pointer.
  fireEvent.click(el, { detail: 1 })
}

describe('useDoubleTap', () => {
  it('covers on a double tap anywhere on the screen, not only the card', () => {
    const onCover = setup()
    tapAt(screen.getByText('說明文字'))
    act(() => vi.advanceTimersByTime(100))
    tapAt(document.body)
    expect(onCover).toHaveBeenCalledOnce()
  })

  it('does not count the click of a pointer tap a second time', () => {
    const onCover = setup()
    tapAt(screen.getByRole('button', { name: '卡' }))
    expect(onCover).not.toHaveBeenCalled()
  })

  it('ignores taps too far apart, right after the card shows, or from a second finger', () => {
    const onCover = vi.fn<() => void>()
    render(<Card onCover={onCover} />)
    tapAt(document.body)
    tapAt(document.body)
    expect(onCover).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(IGNORE_TAPS_MS + 10))
    tapAt(document.body)
    act(() => vi.advanceTimersByTime(DOUBLE_TAP_MS + 10))
    tapAt(document.body)
    fireEvent.pointerDown(document.body, { isPrimary: false })
    expect(onCover).not.toHaveBeenCalled()
  })

  it('still covers from the keyboard on the card button', () => {
    const onCover = setup()
    const card = screen.getByRole('button', { name: '卡' })
    fireEvent.click(card, { detail: 0 })
    act(() => vi.advanceTimersByTime(100))
    fireEvent.click(card, { detail: 0 })
    expect(onCover).toHaveBeenCalledOnce()
  })

  it('stops listening once the card is gone', () => {
    const onCover = vi.fn<() => void>()
    const { unmount } = render(<Card onCover={onCover} />)
    act(() => vi.advanceTimersByTime(IGNORE_TAPS_MS + 10))
    unmount()
    tapAt(document.body)
    tapAt(document.body)
    expect(onCover).not.toHaveBeenCalled()
  })
})
