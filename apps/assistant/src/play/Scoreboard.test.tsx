import {
  createGame,
  defaultPlayerNames,
  gameReducer,
  makePlayers,
  uniformVotes,
} from '@avalon/record-core'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Scoreboard } from './Scoreboard.tsx'

function game(rejected: number) {
  let g = createGame({
    id: 'g',
    now: '2026-11-20T12:00:00.000Z',
    players: makePlayers(defaultPlayerNames(7)),
  })
  const ids = g.players.map((p) => p.id)
  for (let i = 0; i < rejected; i++)
    g = gameReducer(g, {
      type: 'propose',
      team: ids.slice(0, 2),
      votes: uniformVotes(ids, 'reject'),
      inputMode: 'approvals',
    })
  return g
}

describe('Scoreboard', () => {
  it('shows the quest and the proposal attempt', () => {
    render(<Scoreboard game={game(1)} />)
    expect(screen.getByText('第 1 次任務・第 2 次組隊')).toBeTruthy()
    expect(screen.queryByText('強制局')).toBeNull()
  })

  it('marks the 5th proposal as forced', () => {
    render(<Scoreboard game={game(4)} />)
    expect(screen.getByText('強制局')).toBeTruthy()
  })

  it('marks the quest that needs two fails', () => {
    render(<Scoreboard game={game(0)} />)
    expect(screen.getByLabelText('第 4 次任務：4 人，需要 2 張失敗')).toBeTruthy()
  })
})
