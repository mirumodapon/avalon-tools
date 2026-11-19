/**
 * Small polyfills for phones older than the code: Array#toSorted / #toReversed
 * (iOS 16, Chrome 110) and Array#at (iOS 15.4, Chrome 92). Imported first by every
 * app's main.tsx; each only fills in what the browser lacks.
 */
/* oxlint-disable no-extend-native, unicorn/no-array-sort, unicorn/no-array-reverse -- this file
   is the polyfill those rules point to: it must extend Array and use the mutating forms. */

type Compare<T> = ((a: T, b: T) => number) | undefined

/** Adds the missing methods to `target` (Array.prototype; exposed for tests). */
export function installArrayPolyfills(target: object = Array.prototype): void {
  const proto = target as Record<string, unknown>
  const define = (name: string, fn: (...args: never[]) => unknown) => {
    if (typeof proto[name] === 'function') return
    Object.defineProperty(target, name, { value: fn, writable: true, configurable: true })
  }

  define('toSorted', function <T>(this: T[], compare: Compare<T>) {
    return [...this].sort(compare)
  })
  define('toReversed', function <T>(this: T[]) {
    return [...this].reverse()
  })
  define('at', function <T>(this: T[], index: number) {
    const i = Math.trunc(index) || 0
    return this[i < 0 ? this.length + i : i]
  })
}

installArrayPolyfills()
