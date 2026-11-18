import {
  createGame,
  defaultPlayerNames,
  gameReducer,
  makePlayers,
  uniformVotes,
  type Game,
} from '@avalon/record-core'
import { describe, expect, it } from 'vitest'
import { filterGames } from './filter.ts'

const now = new Date(2026, 10, 18, 12)
const ids = ['p1', 'p2', 'p3', 'p4', 'p5']

function make(id: string, created: Date, custom: string | null, note = '', evilWins = false): Game {
  let g = createGame({
    id,
    now: created.toISOString(),
    players: makePlayers(defaultPlayerNames(5)),
    name: { custom },
    note,
  })
  if (evilWins) {
    for (const size of [2, 3, 2]) {
      g = gameReducer(g, {
        type: 'propose',
        team: ids.slice(0, size),
        votes: uniformVotes(ids, 'approve'),
        inputMode: 'approvals',
      })
      g = gameReducer(g, { type: 'recordQuest', failCount: 1 })
    }
  }
  return g
}

const games = [
  make('a', new Date(2026, 10, 18, 9), '週五團', '在咖啡廳'),
  make('b', new Date(2026, 10, 14, 9), null, '刺客神刺', true),
  make('c', new Date(2026, 9, 1, 9), '十月場'),
]
const nameOf = (g: Game) => g.name.custom ?? `auto-${g.id}`
const run = (f: Partial<Parameters<typeof filterGames>[1]>) =>
  filterGames(games, { query: '', winner: 'all', date: 'all', ...f }, nameOf, now).map((g) => g.id)

describe('filterGames', () => {
  it('searches names and notes', () => {
    expect(run({ query: '週五' })).toEqual(['a'])
    expect(run({ query: '咖啡' })).toEqual(['a'])
    expect(run({ query: '刺客' })).toEqual(['b'])
    expect(run({ query: 'AUTO-B' })).toEqual(['b'])
  })
  it('filters by winner', () => {
    expect(run({ winner: 'evil' })).toEqual(['b'])
    expect(run({ winner: 'good' })).toEqual([])
    expect(run({ winner: 'unfinished' })).toEqual(['a', 'c'])
  })
  it('filters by date range', () => {
    expect(run({ date: 'today' })).toEqual(['a'])
    expect(run({ date: '7d' })).toEqual(['a', 'b'])
    expect(run({ date: '30d' })).toEqual(['a', 'b'])
    expect(run({ date: 'all' })).toEqual(['a', 'b', 'c'])
  })
})
