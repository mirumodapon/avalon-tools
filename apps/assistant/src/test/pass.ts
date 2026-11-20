import { HOLD_MS, IGNORE_TAPS_MS } from '@avalon/pass-play'
import { act, fireEvent, screen } from '@testing-library/react'
import { vi } from 'vitest'

const RECT = { left: 0, top: 0, right: 300, bottom: 400, width: 300, height: 400, x: 0, y: 0 }

/** Fake timers and a card-sized hit box, so holds and double taps can be driven. */
export function usePassTimers() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance', 'Date'] })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    ...RECT,
    toJSON: () => RECT,
  })
}

/** Holds the face-down card with this label until it turns over. */
export function hold(label: string | RegExp = '長按查看身分') {
  const card = screen.getByRole('button', { name: label })
  fireEvent.pointerDown(card, { pointerType: 'touch', clientX: 10, clientY: 10 })
  act(() => vi.advanceTimersByTime(HOLD_MS))
}

/** Double-taps the face-up card matching `name` to cover it. */
export function doubleTap(name: RegExp = /雙擊蓋牌/) {
  act(() => vi.advanceTimersByTime(IGNORE_TAPS_MS + 10))
  const card = screen.getByRole('button', { name })
  fireEvent.click(card)
  act(() => vi.advanceTimersByTime(100))
  fireEvent.click(card)
}
