import { useCallback, useEffect, useRef } from 'react'

/** Taps right after a card turns over are the hold being released, not a tap. */
export const IGNORE_TAPS_MS = 500
export const DOUBLE_TAP_MS = 300

/**
 * Calls `onDouble` on two taps within DOUBLE_TAP_MS anywhere on the screen, ignoring taps
 * during the first IGNORE_TAPS_MS after mount. Taps are read from `pointerdown` on the
 * document, which still fires where the zoom guard cancels the second tap's click.
 *
 * Returns a click handler for the card button so keyboard presses (Enter / Space, which
 * fire a click with `detail` 0) count too; pointer clicks are skipped there, since their
 * `pointerdown` was already counted.
 */
export function useDoubleTap(onDouble: () => void): (e: { detail: number }) => void {
  const shownAt = useRef(0)
  const lastTap = useRef(0)
  const onDoubleRef = useRef(onDouble)
  useEffect(() => {
    onDoubleRef.current = onDouble
  })

  const tap = useCallback(() => {
    const now = performance.now()
    if (now - shownAt.current < IGNORE_TAPS_MS) return
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0
      onDoubleRef.current()
    } else {
      lastTap.current = now
    }
  }, [])

  useEffect(() => {
    shownAt.current = performance.now()
    const onPointerDown = (e: PointerEvent) => {
      // A second finger joining a touch is not another tap.
      if (e.isPrimary === false) return
      tap()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [tap])

  return (e) => {
    if (e.detail === 0) tap()
  }
}
