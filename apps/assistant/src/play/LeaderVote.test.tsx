import type { InputMode, Votes } from '@avalon/record-core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSetup } from '../setup/settings.ts'
import { newGame } from '../test/game.ts'
import { LeaderVote } from './LeaderVote.tsx'

const click = (name: string | RegExp) =>
  act(() => fireEvent.click(screen.getByRole('button', { name })))
const TEAM = ['p1', 'p2']

function submit() {
  click('送出投票')
  click('確定')
}

describe('LeaderVote', () => {
  beforeEach(() => {
    localStorage.clear()
    useSetup.getState().update({ leaderInputMode: 'approvals' })
  })

  it('派票: marks who approved', () => {
    const onDone = vi.fn<(votes: Votes, mode: InputMode) => void>()
    render(<LeaderVote game={newGame()} team={TEAM} onDone={onDone} />)
    click(/^3 號/)
    submit()
    expect(onDone).toHaveBeenCalledWith(
      { p1: 'reject', p2: 'reject', p3: 'approve', p4: 'reject', p5: 'reject' },
      'approvals',
    )
  })

  it('派跳: starts from team approves, others reject, and marks the exceptions', () => {
    const onDone = vi.fn<(votes: Votes, mode: InputMode) => void>()
    render(<LeaderVote game={newGame()} team={TEAM} onDone={onDone} />)
    act(() => fireEvent.click(screen.getByRole('radio', { name: '派跳（記異常）' })))
    click(/^2 號/) // a team member who rejected: 場內黑
    click(/^4 號/) // an outsider who approved: 場外白
    expect(screen.getByText('場內黑')).toBeTruthy()
    expect(screen.getByText('場外白')).toBeTruthy()
    submit()
    expect(onDone).toHaveBeenCalledWith(
      { p1: 'approve', p2: 'reject', p3: 'reject', p4: 'approve', p5: 'reject' },
      'anomalies',
    )
  })

  it('keeps the votes when switching between the two ways', () => {
    const onDone = vi.fn<(votes: Votes, mode: InputMode) => void>()
    render(<LeaderVote game={newGame()} team={TEAM} onDone={onDone} />)
    click(/^1 號/)
    click(/^5 號/)
    act(() => fireEvent.click(screen.getByRole('radio', { name: '派跳（記異常）' })))
    submit()
    expect(onDone).toHaveBeenCalledWith(
      { p1: 'approve', p2: 'reject', p3: 'reject', p4: 'reject', p5: 'approve' },
      'anomalies',
    )
  })

  it('remembers the last way used', () => {
    render(<LeaderVote game={newGame()} team={TEAM} onDone={() => {}} />)
    act(() => fireEvent.click(screen.getByRole('radio', { name: '派跳（記異常）' })))
    expect(useSetup.getState().settings.leaderInputMode).toBe('anomalies')
  })
})
