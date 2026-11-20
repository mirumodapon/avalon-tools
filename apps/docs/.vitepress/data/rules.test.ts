import { failsRequired, ROLE_IDS, teamSize } from '@avalon/rules'
import { describe, expect, it } from 'vitest'
import { defaultConfigRows, playerCountRows, roleRows } from './rules.ts'

describe('rules tables', () => {
  it('covers 5–10 players with five quests each, straight from the rules package', () => {
    const rows = playerCountRows()
    expect(rows.map((r) => r.players)).toEqual([5, 6, 7, 8, 9, 10])
    for (const row of rows) {
      expect(row.good + row.evil).toBe(row.players)
      row.quests.forEach((q, i) => {
        expect(q.size).toBe(teamSize(row.players, i))
        expect(q.fails).toBe(failsRequired(row.players, i))
      })
    }
  })

  it('marks the 4th quest with 7+ players as needing two fails', () => {
    const twoFails = playerCountRows().flatMap((r) =>
      r.quests.flatMap((q, i) => (q.fails === 2 ? [`${r.players}-${i + 1}`] : [])),
    )
    expect(twoFails).toEqual(['7-4', '8-4', '9-4', '10-4'])
  })

  it('describes every role, with vision taken from visionFor', () => {
    const rows = roleRows()
    expect(rows.map((r) => r.id)).toEqual([...ROLE_IDS])
    for (const r of rows) expect(r.ability).not.toBe('')
    const by = Object.fromEntries(rows.map((r) => [r.id, r]))
    expect(by.merlin!.seesRoles).toEqual(['莫甘娜', '刺客', '奧伯倫', '莫德雷德的爪牙'])
    expect(by.percival!.seesRoles).toEqual(['梅林', '莫甘娜'])
    expect(by.mordred!.seenBy).not.toContain('梅林')
    expect(by.oberon!.seesRoles).toEqual([])
    expect(by.oberon!.seenBy).toEqual(['梅林'])
  })

  it('lists the default setups', () => {
    const five = defaultConfigRows()[0]!
    expect(five.players).toBe(5)
    expect(five.roles.reduce((n, r) => n + r.count, 0)).toBe(5)
  })
})
