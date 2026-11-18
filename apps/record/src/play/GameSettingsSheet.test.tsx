import { createGame, defaultPlayerNames, makePlayers } from '@avalon/record-core'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryGameRepository } from '../db/memory.ts'
import { setRepository, useGames } from '../games/store.ts'
import { PlayPage } from '../pages/PlayPage.tsx'

let repo: MemoryGameRepository
beforeEach(() => {
  repo = new MemoryGameRepository()
  setRepository(repo)
})
afterEach(() => {
  setRepository(null)
  useGames.setState({ games: [] })
  window.location.hash = ''
})

describe('GameSettingsSheet delete', () => {
  it('deletes the game after confirmation and returns home', async () => {
    const g = createGame({
      id: 'g',
      now: '2026-11-18T10:00:00Z',
      players: makePlayers(defaultPlayerNames(5)),
      name: { custom: '週五團' },
    })
    await repo.put(g)
    useGames.setState({ games: [g] })
    render(<PlayPage id="g" />)
    fireEvent.click(screen.getByRole('button', { name: '遊戲設定' }))
    const dialog = screen.getByRole('dialog', { name: '遊戲設定' })
    fireEvent.click(within(dialog).getByRole('button', { name: /刪除這場遊戲/ }))
    expect(within(dialog).getByRole('alert').textContent).toContain('「週五團」將被永久刪除')
    fireEvent.click(within(dialog).getByRole('button', { name: '取消' }))
    expect(useGames.getState().games).toHaveLength(1)

    fireEvent.click(within(dialog).getByRole('button', { name: /刪除這場遊戲/ }))
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: /確定刪除/ }))
    })
    expect(useGames.getState().games).toHaveLength(0)
    expect(repo.data.size).toBe(0)
    expect(window.location.hash).toBe('#/')
  })
})
