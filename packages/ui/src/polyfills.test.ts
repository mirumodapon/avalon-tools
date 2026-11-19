import { afterEach, describe, expect, it } from 'vitest'
import { installArrayPolyfills } from './polyfills.ts'

const proto = Array.prototype as unknown as Record<string, unknown>
const saved = { toSorted: proto.toSorted, toReversed: proto.toReversed, at: proto.at }

afterEach(() => Object.assign(proto, saved))

describe('polyfills on an old browser', () => {
  it('fills in toSorted, toReversed and at when missing', () => {
    delete proto.toSorted
    delete proto.toReversed
    delete proto.at
    installArrayPolyfills()
    const a = [3, 1, 2]
    expect(a.toSorted((x, y) => x - y)).toEqual([1, 2, 3])
    expect(a.toReversed()).toEqual([2, 1, 3])
    expect(a).toEqual([3, 1, 2])
    expect(a.at(-1)).toBe(2)
    expect(a.at(0)).toBe(3)
    expect(a.at(5)).toBeUndefined()
    expect(Object.keys(a)).toEqual(['0', '1', '2'])
  })

  it('leaves native methods alone', () => {
    const native = proto.toSorted
    installArrayPolyfills()
    expect(proto.toSorted).toBe(native)
  })
})
