import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { useGames } from './games/store.ts'
import { useSettings } from './settings/store.ts'

afterEach(() => {
  window.location.hash = ''
  useGames.setState({ games: [] })
  useSettings.getState().reset()
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
    expect(screen.getAllByRole('combobox', { name: /玩家名稱/ })).toHaveLength(7)
    fireEvent.change(screen.getByRole('combobox', { name: '第 1 位玩家名稱' }), {
      target: { value: '阿明' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: '設為第一位隊長' })[0]!)
    fireEvent.click(screen.getByRole('button', { name: /開始遊戲/ }))
    const [game] = useGames.getState().games
    expect(game?.players).toHaveLength(7)
    expect(game?.players[0]?.name).toBe('阿明')
    expect(game?.firstLeaderId).toBe('p2')
  })

  it('fills seats from the roster and remembers new names', () => {
    useSettings.getState().update({ roster: ['阿明', '小華', '小美'] })
    act(() => {
      window.location.hash = '#/new'
    })
    render(<App />)
    const roster = screen.getByRole('list', { name: '玩家名冊' })
    fireEvent.click(within(roster).getByRole('button', { name: '小華' }))
    fireEvent.click(within(roster).getByRole('button', { name: '阿明' }))
    expect(screen.getByRole<HTMLInputElement>('combobox', { name: '第 1 位玩家名稱' }).value).toBe(
      '小華',
    )
    expect(screen.getByRole<HTMLInputElement>('combobox', { name: '第 2 位玩家名稱' }).value).toBe(
      '阿明',
    )
    // tapping a seated name removes it
    fireEvent.click(within(roster).getByRole('button', { name: /小華/ }))
    expect(screen.getByRole<HTMLInputElement>('combobox', { name: '第 1 位玩家名稱' }).value).toBe(
      '',
    )
    fireEvent.change(screen.getByRole('combobox', { name: '第 3 位玩家名稱' }), {
      target: { value: '新朋友' },
    })
    fireEvent.click(screen.getByRole('button', { name: /開始遊戲/ }))
    const [game] = useGames.getState().games
    expect(game?.players.map((p) => p.name)).toEqual(['1號', '阿明', '新朋友', '4號', '5號'])
    expect(useSettings.getState().settings.roster).toEqual(['阿明', '小華', '小美', '新朋友'])
  })
})
