import { describe, expect, it } from 'vitest'
import { parseRoute, routePath, type Route } from './router.ts'

describe('router', () => {
  it.each<[string, Route]>([
    ['', { name: 'home' }],
    ['#/', { name: 'home' }],
    ['#/new', { name: 'new' }],
    ['#/new/abc', { name: 'new', from: 'abc' }],
    ['#/settings', { name: 'settings' }],
    ['#/play/abc', { name: 'play', id: 'abc' }],
    ['#/summary/a%20b', { name: 'summary', id: 'a b' }],
    ['#/game/x', { name: 'game', id: 'x' }],
    ['#/nope/x/y', { name: 'notFound' }],
  ])('parses %s', (hash, route) => {
    expect(parseRoute(hash)).toEqual(route)
  })
  it('round-trips paths', () => {
    const r: Route = { name: 'play', id: 'a b' }
    expect(parseRoute(routePath(r))).toEqual(r)
  })
})
