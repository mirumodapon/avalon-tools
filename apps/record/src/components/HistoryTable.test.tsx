import {
  createGame,
  defaultPlayerNames,
  gameReducer,
  makePlayers,
  votesFromAnomalies,
  votesFromApprovals,
  type Game,
} from '@avalon/record-core'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HistoryTable } from './HistoryTable.tsx'

const ids = ['p1', 'p2', 'p3', 'p4', 'p5']

/** Same votes (p2 場內黑, p4 場外白), entered either way. */
function game(mode: 'approvals' | 'anomalies'): Game {
  const g = createGame({ id: 'g', now: 'n', players: makePlayers(defaultPlayerNames(5)) })
  const team = ['p1', 'p2']
  const votes =
    mode === 'approvals'
      ? votesFromApprovals(ids, ['p1', 'p4'])
      : votesFromAnomalies(ids, team, { outsideApprove: ['p4'], insideReject: ['p2'] })
  return gameReducer(g, { type: 'propose', team, votes, inputMode: mode })
}

/** Cells of the first proposal row in the quest 1 table. */
function cells() {
  const table = screen.getByRole('table', { name: '任務 1' })
  const row = within(table).getAllByRole('row')[2]! // after title and seat-number rows
  return within(row).getAllByRole('cell')
}

describe('HistoryTable', () => {
  for (const mode of ['approvals', 'anomalies'] as const) {
    it(`shows full votes for a game entered in ${mode} mode`, () => {
      render(<HistoryTable game={game(mode)} viewMode="full" />)
      const c = cells().map((td) => td.textContent)
      expect(c.slice(0, 5)).toEqual([
        expect.stringContaining('贊成'),
        expect.stringContaining('反對'),
        expect.stringContaining('反對'),
        expect.stringContaining('贊成'),
        expect.stringContaining('反對'),
      ])
      expect(c[5]).toContain('否決')
    })

    it(`shows only anomalies for a game entered in ${mode} mode`, () => {
      render(<HistoryTable game={game(mode)} viewMode="anomaly" />)
      const c = cells().map((td) => td.textContent ?? '')
      expect(c[0]).not.toMatch(/場|贊成|反對/)
      expect(c[1]).toContain('場內黑')
      expect(c[2]).not.toMatch(/場/)
      expect(c[3]).toContain('場外白')
    })
  }

  it('marks the leader and team members for screen readers', () => {
    render(<HistoryTable game={game('approvals')} viewMode="full" />)
    expect(cells()[0]!.textContent).toContain('1號，隊長，隊員')
  })
})

describe('HistoryTable headers', () => {
  it('labels each quest table with seat numbers only', () => {
    render(<HistoryTable game={game('approvals')} viewMode="full" />)
    const table = screen.getByRole('table', { name: '任務 1' })
    const header = within(table).getAllByRole('row')[1]!
    const cols = within(header)
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    expect(cols).toEqual(['次', '1', '2', '3', '4', '5', '票'])
    expect(within(header).getByRole('columnheader', { name: '1 號 1號' })).toBeTruthy()
  })
})
