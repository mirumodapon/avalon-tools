import { createGame, defaultPlayerNames, makePlayers } from '@avalon/record-core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TeamPicker } from './TeamPicker.tsx'

const game = createGame({
  id: 'g',
  now: '2026-11-20T12:00:00.000Z',
  players: makePlayers(['小明', ...defaultPlayerNames(5).slice(1)]),
  firstLeaderId: 'p2',
})

describe('TeamPicker', () => {
  it('names the leader and how many to pick', () => {
    render(<TeamPicker game={game} onSubmit={() => {}} />)
    expect(screen.getByText('隊長：2 號')).toBeTruthy()
    expect(screen.getByText('需要 2 人')).toBeTruthy()
  })

  it('only submits a full team, after confirming it', () => {
    const onSubmit = vi.fn<(team: string[]) => void>()
    render(<TeamPicker game={game} onSubmit={onSubmit} />)
    const send = screen.getByRole('button', { name: '送出組隊' })
    act(() => fireEvent.click(screen.getByRole('button', { name: '1 號・小明' })))
    expect(send.hasAttribute('disabled')).toBe(true)
    act(() => fireEvent.click(screen.getByRole('button', { name: '3 號' })))
    expect(screen.getByRole('button', { name: '3 號' }).getAttribute('aria-pressed')).toBe('true')
    act(() => fireEvent.click(send))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('1 號・小明、3 號')).toBeTruthy()
    act(() => fireEvent.click(screen.getByRole('button', { name: '確定' })))
    expect(onSubmit).toHaveBeenCalledWith(['p1', 'p3'])
  })

  it('does not pick more than the team size', () => {
    render(<TeamPicker game={game} onSubmit={() => {}} />)
    for (const name of ['1 號・小明', '2 號', '3 號'])
      act(() => fireEvent.click(screen.getByRole('button', { name })))
    expect(screen.getByRole('button', { name: '3 號' }).getAttribute('aria-pressed')).toBe('false')
  })
})
