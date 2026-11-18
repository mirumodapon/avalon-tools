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
  it('offers single-game export only at the bottom of the game page', () => {
    useGames.setState({ games: [{ ...game('a', '週五團'), savedAt: '2026-11-18T11:00:00.000Z' }] })
    const { unmount } = render(<App />)
    expect(screen.queryByRole('button', { name: /匯出|^匯入$/ })).toBeNull()
    // the QR scanner is the one import entry point on the home page
    expect(screen.getByRole('button', { name: '掃描 QR' })).toBeTruthy()
    unmount()
    go('#/game/a')
    render(<App />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.at(-1)?.textContent).toBe('匯出這場')
    fireEvent.click(screen.getByRole('button', { name: '匯出這場' }))
    expect(
      within(screen.getByRole('dialog', { name: '匯出' })).getByText(/檔名：週五團\.json/),
    ).toBeTruthy()
  })

  it('keeps only export-all and import in settings', () => {
    useGames.setState({ games: [game('a', '週五團'), game('b', '週六團')] })
    go('#/settings')
    render(<App />)
    expect(screen.getByRole('button', { name: /全部匯出/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^匯入$/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /匯出單場|匯出這場/ })).toBeNull()
  })
})
