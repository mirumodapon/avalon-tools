import { createGame, defaultPlayerNames, makePlayers } from '@avalon/core'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '../App.tsx'
import { useGames } from '../games/store.ts'

const game = (id: string, custom: string) =>
  createGame({
    id,
    now: '2026-11-18T10:00:00.000Z',
    players: makePlayers(defaultPlayerNames(5)),
    name: { custom },
  })

function go(hash: string) {
  act(() => {
    window.location.hash = hash
  })
}

afterEach(() => {
  go('')
  useGames.setState({ games: [] })
})

describe('export/import placement', () => {
  it('is not offered on the home page or game detail page', () => {
    useGames.setState({ games: [{ ...game('a', '週五團'), savedAt: '2026-11-18T11:00:00.000Z' }] })
    const { unmount } = render(<App />)
    expect(screen.queryByRole('button', { name: /匯出|匯入/ })).toBeNull()
    unmount()
    go('#/game/a')
    render(<App />)
    expect(screen.queryByRole('button', { name: /匯出|匯入/ })).toBeNull()
  })

  it('is available in settings, including single-game export', () => {
    useGames.setState({ games: [game('a', '週五團'), game('b', '週六團')] })
    go('#/settings')
    render(<App />)
    expect(screen.getByRole('button', { name: /全部匯出/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^匯入$/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /匯出單場/ }))
    fireEvent.click(
      within(screen.getByRole('dialog', { name: /匯出單場/ })).getByRole('button', {
        name: '週六團',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: /匯出這場/ }))
    const dialog = screen.getByRole('dialog', { name: '匯出' })
    expect(within(dialog).getByText(/檔名：週六團\.json/)).toBeTruthy()
  })
})
