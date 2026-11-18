/**
 * Blocks page zoom globally (the app is a fixed-scale recording tool):
 * - iOS pinch (gesture* events) and any two-finger touch move
 * - a quick second tap on non-interactive areas (iOS Safari double-tap zoom)
 * - dblclick, and ctrl/⌘ + wheel or keyboard zoom on desktop
 */

const DOUBLE_TAP_MS = 350
const INTERACTIVE = 'button, a, input, textarea, select, label, [role="button"], [contenteditable]'

function stop(e: Event) {
  if (e.cancelable) e.preventDefault()
}

export function installZoomGuard(doc: Document = document): () => void {
  const listeners: [string, EventListener, AddEventListenerOptions][] = []
  const on = <E extends Event>(type: string, fn: (e: E) => void) => {
    const opts = { passive: false, capture: true }
    doc.addEventListener(type, fn as EventListener, opts)
    listeners.push([type, fn as EventListener, opts])
  }

  on('gesturestart', stop)
  on('gesturechange', stop)
  on('gestureend', stop)
  on<TouchEvent>('touchmove', (e) => {
    if (e.touches.length > 1) stop(e)
  })

  let lastTap = 0
  on<TouchEvent>('touchend', (e) => {
    const now = e.timeStamp || Date.now()
    const target = e.target instanceof Element ? e.target : null
    // Rapid taps on controls must still register as clicks; only block elsewhere.
    if (now - lastTap < DOUBLE_TAP_MS && !target?.closest(INTERACTIVE)) stop(e)
    lastTap = now
  })
  on('dblclick', stop)

  on<WheelEvent>('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) stop(e)
  })
  on<KeyboardEvent>('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) stop(e)
  })

  return () => {
    for (const [type, fn, opts] of listeners) doc.removeEventListener(type, fn, opts)
  }
}
