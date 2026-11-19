import { describe, expect, it } from 'vitest'
import type { RoleId } from './types.ts'
import { visionFor, type SeatRole } from './vision.ts'

/** 10 players with every special role. */
const TABLE: SeatRole[] = (
  [
    'loyal', // 1
    'oberon', // 2
    'merlin', // 3
    'minion', // 4
    'mordred', // 5
    'morgana', // 6
    'loyal', // 7
    'assassin', // 8
    'percival', // 9
    'loyal', // 10
  ] as RoleId[]
).map((role, i) => ({ seat: i + 1, role }))

const of = (role: RoleId, table = TABLE) =>
  visionFor(
    table.find((p) => p.role === role)!,
    table,
  )

describe('visionFor', () => {
  it('Merlin sees every evil player except Mordred, including Oberon', () => {
    expect(of('merlin')).toEqual({ kind: 'evil', seats: [2, 4, 6, 8] })
  })

  it('Percival sees Merlin and Morgana in seat order, not role order', () => {
    expect(of('percival')).toEqual({ kind: 'merlinOrMorgana', seats: [3, 6] })
    const swapped = TABLE.map((p) =>
      p.role === 'merlin'
        ? { ...p, role: 'morgana' as const }
        : p.role === 'morgana'
          ? { ...p, role: 'merlin' as const }
          : p,
    )
    expect(of('percival', swapped)).toEqual({ kind: 'merlinOrMorgana', seats: [3, 6] })
  })

  it('Percival sees only Merlin without Morgana', () => {
    const table = TABLE.map((p) => (p.role === 'morgana' ? { ...p, role: 'minion' as const } : p))
    expect(of('percival', table)).toEqual({ kind: 'merlinOrMorgana', seats: [3] })
  })

  it('loyal servants see nothing', () => {
    expect(of('loyal')).toEqual({ kind: 'none' })
  })

  it.each(['assassin', 'morgana', 'mordred', 'minion'] as const)(
    '%s sees the other evil players except Oberon',
    (role) => {
      const self = TABLE.find((p) => p.role === role)!.seat
      expect(of(role)).toEqual({ kind: 'teammates', seats: [4, 5, 6, 8].filter((s) => s !== self) })
    },
  )

  it('Oberon sees no one and is seen by no evil player', () => {
    expect(of('oberon')).toEqual({ kind: 'isolated' })
    for (const role of ['assassin', 'morgana', 'mordred', 'minion'] as const) {
      const v = of(role)
      expect(v.kind === 'teammates' && v.seats.includes(2)).toBe(false)
    }
  })

  it('an evil player can have no visible teammate', () => {
    const table: SeatRole[] = [
      { seat: 1, role: 'assassin' },
      { seat: 2, role: 'oberon' },
      { seat: 3, role: 'merlin' },
      { seat: 4, role: 'loyal' },
      { seat: 5, role: 'loyal' },
    ]
    expect(of('assassin', table)).toEqual({ kind: 'teammates', seats: [] })
    expect(of('merlin', table)).toEqual({ kind: 'evil', seats: [1, 2] })
  })
})
