import { dateKey, DEFAULT_NAMING } from '@avalon/record-core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '../App.tsx'
import { useGames } from '../games/store.ts'
import { useSettings } from '../settings/store.ts'

afterEach(() => {
  window.location.hash = ''
  useGames.setState({ games: [] })
  useSettings.getState().reset()
})

function createUnnamedGame() {
  act(() => {
    window.location.hash = '#/new'
  })
  const { unmount } = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /開始遊戲/ }))
  unmount()
}

describe('auto naming', () => {
  it('numbers same-day games and follows template changes live', () => {
    createUnnamedGame()
    createUnnamedGame()
    const today = dateKey(new Date())
    const [second, first] = useGames.getState().games
    expect(first!.name).toMatchObject({ custom: null, seq: 1, auto: `${today} 第1場` })
    expect(second!.name).toMatchObject({ custom: null, seq: 2, auto: `${today} 第2場` })

    act(() => {
      window.location.hash = ''
    })
    render(<App />)
    expect(screen.getByRole('button', { name: `${today} 第2場` })).toBeTruthy()
    act(() =>
      useSettings
        .getState()
        .update({ naming: { ...DEFAULT_NAMING, template: '#{seq} {players}人' } }),
    )
    expect(screen.getByRole('button', { name: '#2 5人' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '#1 5人' })).toBeTruthy()
  })
})
