import { describe, expect, it } from 'vitest'
import {
  addName,
  isDefaultSeatName,
  mergeNames,
  normalizeRoster,
  removeName,
  renameName,
} from './roster.ts'

describe('roster', () => {
  it('normalizes stored values', () => {
    expect(normalizeRoster(['  阿明 ', '', 3, '阿明', '小華'])).toEqual(['阿明', '小華'])
    expect(normalizeRoster('nope')).toEqual([])
  })

  it('adds names, rejecting blanks and duplicates', () => {
    expect(addName(['阿明'], ' 小華 ')).toEqual({ ok: true, roster: ['阿明', '小華'] })
    expect(addName(['阿明'], ' ')).toMatchObject({ ok: false })
    expect(addName(['阿明'], '阿明')).toMatchObject({ ok: false, error: '「阿明」已在名冊中' })
  })

  it('renames in place', () => {
    expect(renameName(['阿明', '小華'], 1, '小美')).toEqual({ ok: true, roster: ['阿明', '小美'] })
    expect(renameName(['阿明', '小華'], 1, '阿明')).toMatchObject({ ok: false })
    expect(renameName(['阿明'], 0, '阿明')).toEqual({ ok: true, roster: ['阿明'] })
  })

  it('removes by index', () => {
    expect(removeName(['a', 'b', 'c'], 1)).toEqual(['a', 'c'])
  })

  it('merges names used in a game, skipping default seat names', () => {
    expect(isDefaultSeatName('3號')).toBe(true)
    expect(isDefaultSeatName('阿3號哥')).toBe(false)
    expect(mergeNames(['阿明'], ['阿明', '2號', ' 小華 ', ''])).toEqual(['阿明', '小華'])
  })
})
