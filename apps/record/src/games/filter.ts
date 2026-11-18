import { dateKey, deriveState, type Game } from '@avalon/record-core'

export type WinnerFilter = 'all' | 'good' | 'evil' | 'unfinished'
export type DateFilter = 'all' | 'today' | '7d' | '30d'

export interface GameFilter {
  query: string
  winner: WinnerFilter
  date: DateFilter
}

export const EMPTY_FILTER: GameFilter = { query: '', winner: 'all', date: 'all' }

const DAY = 24 * 60 * 60 * 1000

/** Filters games by name/note text, winner and date range. */
export function filterGames(
  games: readonly Game[],
  filter: GameFilter,
  nameOf: (g: Game) => string,
  now: Date = new Date(),
): Game[] {
  const q = filter.query.trim().toLowerCase()
  const today = dateKey(now)
  return games.filter((g) => {
    if (q && !`${nameOf(g)}\n${g.note}`.toLowerCase().includes(q)) return false
    if (filter.winner !== 'all') {
      const winner = deriveState(g).winner
      if (filter.winner === 'unfinished' ? winner !== null : winner !== filter.winner) return false
    }
    if (filter.date !== 'all') {
      const created = new Date(g.createdAt)
      if (filter.date === 'today' && dateKey(created) !== today) return false
      const days = filter.date === '7d' ? 7 : 30
      if (filter.date !== 'today' && now.getTime() - created.getTime() > days * DAY) return false
    }
    return true
  })
}

/** Games still being recorded (not yet saved on the settlement page). */
export function isInProgress(game: Game): boolean {
  return game.savedAt === null
}
