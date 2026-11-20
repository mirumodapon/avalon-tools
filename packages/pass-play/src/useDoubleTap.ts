import { useEffect, useRef } from 'react'

/** Taps right after a card turns over are the hold being released, not a tap. */
export const IGNORE_TAPS_MS = 500
export const DOUBLE_TAP_MS = 300

/**
 * Click handler that calls `onDouble` on two taps within DOUBLE_TAP_MS, ignoring taps
 * during the first IGNORE_TAPS_MS after mount. Use on a <button> so the zoom guard
 * lets quick taps through.
 */
export function useDoubleTap(onDouble: () => void): () => void {
  const shownAt = useRef(0)
  const lastTap = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])
  return () => {
    const now = performance.now()
    if (now - shownAt.current < IGNORE_TAPS_MS) return
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0
      onDouble()
    } else {
      lastTap.current = now
    }
  }
}
