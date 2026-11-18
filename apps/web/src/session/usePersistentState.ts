import { useEffect, useState } from 'react'
import { storageKey } from '../storage/storage.ts'

/**
 * Like useState, but the value survives the app being closed. Each `scope` keeps a
 * single slot tagged with `key` (e.g. game + step); a different key starts fresh,
 * so a draft never leaks into another game or step.
 */
export function usePersistentState<T>(
  scope: string,
  key: string,
  initial: T | (() => T),
): [T, (value: T | ((prev: T) => T)) => void] {
  const slot = storageKey(`ui:${scope}`)
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(slot) ?? 'null') as {
        key: string
        value: T
      } | null
      if (saved && saved.key === key) return saved.value
    } catch {
      // ignore unreadable drafts
    }
    return typeof initial === 'function' ? (initial as () => T)() : initial
  })

  useEffect(() => {
    try {
      localStorage.setItem(slot, JSON.stringify({ key, value }))
    } catch {
      // best effort
    }
  }, [slot, key, value])

  return [value, setValue]
}
