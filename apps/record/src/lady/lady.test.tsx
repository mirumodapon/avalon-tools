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
    })
    expect(deriveState(g).phase).toBe('proposal')
  })

  it('has no note field', () => {
    useGames.setState({ games: [atLady()] })
    render(<PlayPage id="g" />)
    expect(screen.queryByRole('button', { name: /備註/ })).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('cannot be skipped', () => {
    useGames.setState({ games: [atLady()] })
    render(<PlayPage id="g" />)
    expect(screen.queryByRole('button', { name: /跳過/ })).toBeNull()
    expect(
      (screen.getByRole('button', { name: /選擇查驗對象/ }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('shows the declaration in detail, and the lie only when roles are shown', () => {
    const g = gameReducer(atLady(), { type: 'useLady', targetId: 'p3', declared: 'good' })
    const detailed = {
      questResult: 'detailed',
      ladyResult: 'detailed',
      ladyLayout: 'compact',
    } as const
    const { unmount } = render(<HistoryTable game={g} viewMode="full" display={detailed} />)
    const row = screen.getByRole('region', { name: '湖中女神第 1 次' })
    expect(row.textContent).toContain('7號 → 3號')
    expect(row.textContent).toContain('宣告好人')
    expect(row.textContent).not.toMatch(/說謊|實際/)
    unmount()
    render(<HistoryTable game={g} viewMode="full" showRoles display={detailed} />)
    expect(
      within(screen.getByRole('region', { name: '湖中女神第 1 次' })).getByText('說謊'),
    ).toBeTruthy()
  })

  it('shows seat numbers and a faction icon in simple mode', () => {
    const g = gameReducer(atLady(), { type: 'useLady', targetId: 'p3', declared: 'evil' })
    const simple = { questResult: 'simple', ladyResult: 'simple', ladyLayout: 'compact' } as const
    render(<HistoryTable game={g} viewMode="full" display={simple} />)
    const row = screen.getByRole('region', { name: '湖中女神第 1 次' })
    expect(row.textContent).toBe('湖中女神7查驗3:壞人')
  })
})

function threeQuests(): Game {
  let g = gameReducer(atLady(), { type: 'useLady', targetId: 'p3', declared: 'good' })
  const ids = g.players.map((p) => p.id)
  g = gameReducer(g, {
    type: 'propose',
    team: ids.slice(0, 3),
    votes: uniformVotes(ids, 'approve'),
    inputMode: 'approvals',
  })
  g = gameReducer(g, { type: 'recordQuest', failCount: 1 })
  return gameReducer(g, { type: 'useLady', targetId: 'p5', declared: 'evil' })
}

const holderSeats = (q: number) =>
  within(screen.getByRole('table', { name: `任務 ${q}` }))
    .getAllByRole('columnheader')
    .filter((th) => th.getAttribute('aria-label')?.includes('湖中女神持有者'))
    .map((th) => th.textContent)

describe('lady display options', () => {
  it('shows the whole chain once in separate layout', () => {
    const display = { questResult: 'simple', ladyResult: 'simple', ladyLayout: 'separate' } as const
    render(<HistoryTable game={threeQuests()} viewMode="full" display={display} />)
    const chain = screen.getByRole('region', { name: '湖中女神查驗順序' })
    expect(chain.textContent).toBe('湖中女神7查驗3(好人)查驗5(壞人)')
    expect(screen.queryByRole('region', { name: '湖中女神第 1 次' })).toBeNull()
  })

  it('highlights only the holder during each quest in the column header', () => {
    render(<HistoryTable game={threeQuests()} viewMode="full" />)
    expect(holderSeats(1)).toEqual(['7'])
    expect(holderSeats(2)).toEqual(['7'])
    expect(holderSeats(3)).toEqual(['3'])
  })
})
