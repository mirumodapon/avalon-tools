import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { useGames } from './games/store.ts'

afterEach(() => {
  window.location.hash = ''
  useGames.setState({ games: [] })
})

describe('App', () => {
  it('renders the home page', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '阿瓦隆紀錄' })).toBeTruthy()
  })

  it('creates a game from the setup page', () => {
    act(() => {
      window.location.hash = '#/new'
    })
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: '7' }))
    expect(screen.getAllByRole('textbox', { name: /玩家名稱/ })).toHaveLength(7)
    fireEvent.change(screen.getByRole('textbox', { name: '第 1 位玩家名稱' }), {
      target: { value: '阿明' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: '設為第一位隊長' })[0]!)
    fireEvent.click(screen.getByRole('button', { name: /開始遊戲/ }))
    const [game] = useGames.getState().games
    expect(game?.players).toHaveLength(7)
    expect(game?.players[0]?.name).toBe('阿明')
    expect(game?.firstLeaderId).toBe('p2')
  })
})
