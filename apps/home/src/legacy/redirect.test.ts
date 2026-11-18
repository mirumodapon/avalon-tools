import { describe, expect, it } from 'vitest'
import { legacyRedirect } from './redirect.ts'

const go = (href: string) => {
  const u = new URL(href, 'https://avalon.example')
  return legacyRedirect({ pathname: u.pathname, search: u.search, hash: u.hash })
}

describe('legacy 1.x URLs', () => {
  it.each([
    ['/#/new', '/record/#/new'],
    ['/#/new/3f2b8c1e', '/record/#/new/3f2b8c1e'],
    ['/#/play/abc', '/record/#/play/abc'],
    ['/#/summary/abc', '/record/#/summary/abc'],
    ['/#/game/abc', '/record/#/game/abc'],
    ['/#/settings', '/record/#/settings'],
    ['/index.html#/play/abc', '/record/#/play/abc'],
    ['/?s=eJxLTEoGAAJMAS0', '/record/?s=eJxLTEoGAAJMAS0'],
    ['/?s=abc#/', '/record/?s=abc#/'],
  ])('%s → %s', (from, to) => {
    expect(go(from)).toBe(to)
  })

  it.each([
    '/',
    '/#/',
    '/#/info',
    '/#/newsletter',
    '/?x=1',
    '/record/#/play/abc',
    '/record/?s=abc',
    '/nope#/play/x',
  ])('leaves %s alone', (url) => {
    expect(go(url)).toBeNull()
  })
})
