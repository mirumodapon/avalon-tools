import { describe, expect, it } from 'vitest'
import { configSummary, formatWhen } from './summary.ts'

const at = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime()
const NOW = at(2026, 11, 19, 21, 0)

describe('formatWhen', () => {
  it('says today and yesterday', () => {
    expect(formatWhen(at(2026, 11, 19, 8, 34), NOW)).toEqual({ day: '今天', time: '08:34' })
    expect(formatWhen(at(2026, 11, 18, 23, 5), NOW)).toEqual({ day: '昨天', time: '23:05' })
  })

  it('shows the date and weekday otherwise, with the year only when it differs', () => {
    expect(formatWhen(at(2026, 11, 12, 20, 0), NOW).day).toBe('11/12（四）')
    expect(formatWhen(at(2025, 12, 31, 20, 0), NOW).day).toBe('2025/12/31（三）')
  })
})

describe('configSummary', () => {
  it('names the special roles', () => {
    const base = { id: 'x', createdAt: 0, kind: 'roles' as const, playerCount: 5, assignments: [] }
    expect(configSummary({ ...base, config: ['merlin', 'assassin'] })).toBe('梅林、刺客')
    expect(configSummary({ ...base, config: [] })).toBe('只有忠臣與爪牙')
  })
})
