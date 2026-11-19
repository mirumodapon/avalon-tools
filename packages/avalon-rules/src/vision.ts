import { roleFaction } from './roles.ts'
import type { RoleId } from './types.ts'

/** A player's seat number (1-based) and role. */
export interface SeatRole {
  seat: number
  role: RoleId
}

/**
 * What a role learns during the night phase. Seat lists are sorted ascending, so
 * their order never gives away who is who (e.g. Merlin vs Morgana for Percival).
 */
export type Vision =
  /** Merlin: every evil player except Mordred (Oberon included). */
  | { kind: 'evil'; seats: number[] }
  /** Percival: Merlin and Morgana, indistinguishable. */
  | { kind: 'merlinOrMorgana'; seats: number[] }
  /** Evil (except Oberon): the other evil players, Oberon excluded. */
  | { kind: 'teammates'; seats: number[] }
  /** Oberon: knows no one and no one knows him. */
  | { kind: 'isolated' }
  /** Loyal servants: no extra information. */
  | { kind: 'none' }

const sorted = (seats: number[]) => seats.toSorted((a, b) => a - b)

export function visionFor(self: SeatRole, table: readonly SeatRole[]): Vision {
  const others = table.filter((p) => p.seat !== self.seat)
  const seatsOf = (pick: (p: SeatRole) => boolean) => sorted(others.filter(pick).map((p) => p.seat))
  switch (self.role) {
    case 'merlin':
      return {
        kind: 'evil',
        seats: seatsOf((p) => roleFaction(p.role) === 'evil' && p.role !== 'mordred'),
      }
    case 'percival':
      return {
        kind: 'merlinOrMorgana',
        seats: seatsOf((p) => p.role === 'merlin' || p.role === 'morgana'),
      }
    case 'oberon':
      return { kind: 'isolated' }
    case 'loyal':
      return { kind: 'none' }
    case 'assassin':
    case 'morgana':
    case 'mordred':
    case 'minion':
      return {
        kind: 'teammates',
        seats: seatsOf((p) => roleFaction(p.role) === 'evil' && p.role !== 'oberon'),
      }
  }
}
