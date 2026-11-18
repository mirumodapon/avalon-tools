import { afterEach, describe, expect, it } from 'vitest'
import { installZoomGuard } from './zoomGuard.ts'

let uninstall = () => {}
afterEach(() => uninstall())

function fire(
  type: string,
  init: Record<string, unknown> = {},
  target: EventTarget = document.body,
) {
  const e = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(e, init)
  target.dispatchEvent(e)
  return e.defaultPrevented
}

describe('zoom guard', () => {
  it('blocks pinch, double tap on content, dblclick and ctrl zoom', () => {
    uninstall = installZoomGuard()
    expect(fire('gesturestart')).toBe(true)
    expect(fire('touchmove', { touches: [{}, {}] })).toBe(true)
    expect(fire('touchmove', { touches: [{}] })).toBe(false)
    expect(fire('touchend')).toBe(false)
    expect(fire('touchend')).toBe(true)
    expect(fire('dblclick')).toBe(true)
    expect(fire('wheel', { ctrlKey: true })).toBe(true)
    expect(fire('wheel', { ctrlKey: false })).toBe(false)
    expect(fire('keydown', { ctrlKey: true, key: '+' })).toBe(true)
  })

  it('never blocks quick repeated taps on controls', () => {
    uninstall = installZoomGuard()
    const button = document.createElement('button')
    document.body.append(button)
    expect(fire('touchend', {}, button)).toBe(false)
    expect(fire('touchend', {}, button)).toBe(false)
    button.remove()
  })

  it('can be uninstalled', () => {
    installZoomGuard()()
    expect(fire('dblclick')).toBe(false)
  })
})
