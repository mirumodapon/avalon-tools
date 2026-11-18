import {
  createGame,
  defaultPlayerNames,
  deriveState,
  gameReducer,
  makePlayers,
  uniformVotes,
  type Game,
} from '@avalon/core'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HistoryTable } from '../components/HistoryTable.tsx'
import { useGames } from '../games/store.ts'
import { PlayPage } from '../pages/PlayPage.tsx'

function atLady(): Game {
  let g = createGame({
    id: 'g',
    now: 'n',
    players: makePlayers(defaultPlayerNames(7)),
    lady: { initialHolderId: 'p7' },
    roleAssignment: { p3: 'morgana' },
  })
  const ids = g.players.map((p) => p.id)
  for (const fails of [0, 1]) {
    const size = deriveState(g).teamSize
    g = gameReducer(g, {
      type: 'propose',
      team: ids.slice(0, size),
      votes: uniformVotes(ids, 'approve'),
      inputMode: 'approvals',
    })
    g = gameReducer(g, { type: 'recordQuest', failCount: fails })
  }
  return g
}

describe('Lady of the Lake UI', () => {
  it('records a use, disabling the holder', () => {
    useGames.setState({ games: [atLady()] })
    render(<PlayPage id="g" />)
    expect(screen.getByText(/湖中女神・第 1 次/)).toBeTruthy()
    const holder = screen.getByRole('button', { name: /7號/ })
    expect((holder as HTMLButtonElement).disabled).toBe(true)
    expect(holder.textContent).toContain('不能查驗自己')
    fireEvent.click(screen.getByRole('button', { name: /3號/ }))
    fireEvent.click(screen.getByRole('radio', { name: '好人' }))
    fireEvent.click(screen.getByRole('button', { name: /送出查驗/ }))
    const g = useGames.getState().games[0]!
    expect(g.lady!.uses[0]).toMatchObject({
      holderId: 'p7',
      targetId: 'p3',
      declared: 'good',
      skipped: false,
    })
    expect(deriveState(g).phase).toBe('proposal')
  })

  it('can skip a use', () => {
    useGames.setState({ games: [atLady()] })
    render(<PlayPage id="g" />)
    fireEvent.click(screen.getByRole('button', { name: /跳過這次/ }))
    expect(useGames.getState().games[0]!.lady!.uses[0]).toMatchObject({
      skipped: true,
      holderId: 'p7',
    })
  })

  it('shows the declaration, and the lie only when roles are shown', () => {
    const g = gameReducer(atLady(), { type: 'useLady', targetId: 'p3', declared: 'good' })
    const { unmount } = render(<HistoryTable game={g} viewMode="full" />)
    const row = screen.getByText(/7號 →/).closest('tr')!
    expect(row.textContent).toContain('宣告好人')
    expect(row.textContent).not.toMatch(/說謊|實際/)
    unmount()
    render(<HistoryTable game={g} viewMode="full" showRoles />)
    const row2 = screen.getByText(/7號 →/).closest('tr')!
    expect(within(row2).getByText('說謊')).toBeTruthy()
  })
})
