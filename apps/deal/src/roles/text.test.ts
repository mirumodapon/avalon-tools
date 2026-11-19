import { visionFor, type SeatRole } from '@avalon/rules'
import { describe, expect, it } from 'vitest'
import { visionText } from './text.ts'

const table: SeatRole[] = [
  { seat: 1, role: 'loyal' },
  { seat: 2, role: 'oberon' },
  { seat: 3, role: 'merlin' },
  { seat: 5, role: 'morgana' },
  { seat: 6, role: 'percival' },
  { seat: 7, role: 'assassin' },
  { seat: 8, role: 'mordred' },
]
const line = (seat: number) =>
  visionText(
    visionFor(
      table.find((p) => p.seat === seat)!,
      table,
    ),
  )

describe('visionText', () => {
  it('words every vision like the card shows it', () => {
    expect(line(3)).toBe('壞人：2、5、7 號')
    expect(line(6)).toBe('梅林／莫甘娜：3、5 號')
    expect(line(1)).toBe('你沒有額外資訊')
    expect(line(7)).toBe('壞人隊友：5、8 號')
    expect(line(2)).toBe('你不認識隊友，隊友也不認識你')
  })

  it('covers empty sightings', () => {
    expect(visionText({ kind: 'teammates', seats: [] })).toBe('你看不到任何壞人隊友')
    expect(visionText({ kind: 'evil', seats: [] })).toBe('你看不到任何壞人')
  })
})
