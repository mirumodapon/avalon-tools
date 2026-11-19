import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type SyntheticEvent,
} from 'react'

const prevent = (e: SyntheticEvent) => e.preventDefault()

/** How long a card must be held before it turns over. */
export const HOLD_MS = 2500

/**
 * Press-and-hold. Pointer events cover touch, pen and mouse. Lifting early, sliding
 * off the element or the browser cancelling the touch all reset it. Touch pointers
 * are captured implicitly (no pointerleave), so leaving is checked on move.
 */
export function useHold(onDone: () => void, ms = HOLD_MS) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rect = useRef<DOMRect | null>(null)
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  }, [onDone])

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    rect.current = null
    setHolding(false)
  }, [])

  useEffect(() => cancel, [cancel])

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    cancel()
    rect.current = e.currentTarget.getBoundingClientRect()
    setHolding(true)
    timer.current = setTimeout(() => {
      timer.current = null
      setHolding(false)
      navigator.vibrate?.(60)
      done.current()
    }, ms)
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const r = rect.current
    if (!r) return
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      cancel()
  }

  return {
    holding,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onPointerLeave: cancel,
      onContextMenu: prevent,
      onDragStart: prevent,
    },
  }
}
