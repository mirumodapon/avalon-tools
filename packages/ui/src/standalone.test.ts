import { afterEach, describe, expect, it, vi } from 'vitest'
import { canLinkHome, markHomeWindow } from './standalone.ts'

function standalone(on: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q.includes('standalone') }))
}

afterEach(() => {
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

describe('canLinkHome', () => {
  it('always links home in a browser tab', () => {
    standalone(false)
    expect(canLinkHome()).toBe(true)
  })

  it('does not link home from a tool installed on its own', () => {
    standalone(true)
    expect(canLinkHome()).toBe(false)
  })

  it('links home when the window belongs to the installed home', () => {
    standalone(true)
    markHomeWindow()
    expect(canLinkHome()).toBe(true)
  })

  it('home only marks its window when installed', () => {
    standalone(false)
    markHomeWindow()
    standalone(true)
    expect(canLinkHome()).toBe(false)
  })
})
