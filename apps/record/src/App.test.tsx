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

const seat = (i: number) =>
  screen.getByRole<HTMLInputElement>('textbox', { name: `第 ${i} 位玩家名稱` }).value

describe('App', () => {
  it('renders the home page', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '阿瓦隆紀錄' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '使用說明' }).getAttribute('href')).toBe(
      '/docs/guide/record/',
    )
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

  it('picks players from the roster in order and remembers new names', () => {
    const roster = ['阿明', '小華', '小美', '大雄', '靜香', '胖虎']
    useSettings.getState().update({ roster })
    act(() => {
      window.location.hash = '#/new'
    })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /從名冊選擇/ }))
    const dialog = screen.getByRole('dialog', { name: '依座位順序點選玩家' })
    const list = within(dialog).getByRole('list', { name: '玩家名冊' })
    for (const n of ['小美', '阿明', '胖虎', '小華', '大雄', '靜香']) {
      fireEvent.click(within(list).getByRole('button', { name: n }))
    }
    // tapping again removes a pick; later picks move up
    fireEvent.click(within(list).getByRole('button', { name: '胖虎，第 3 位' }))
    expect(within(list).getByRole('button', { name: '靜香，第 5 位' })).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: /完成/ }))

    expect([1, 2, 3, 4, 5].map(seat)).toEqual(['小美', '阿明', '小華', '大雄', '靜香'])
    expect(screen.getByRole('radio', { name: '5' })).toHaveProperty('checked', true)

    fireEvent.change(screen.getByRole('textbox', { name: '第 5 位玩家名稱' }), {
      target: { value: '新朋友' },
    })
    fireEvent.click(screen.getByRole('button', { name: /開始遊戲/ }))
    const [game] = useGames.getState().games
    expect(game?.players.map((p) => p.name)).toEqual(['小美', '阿明', '小華', '大雄', '新朋友'])
    expect(useSettings.getState().settings.roster).toEqual([...roster, '新朋友'])
  })

  it('accepts fewer picks than seats and keeps the player count', () => {
    useSettings.getState().update({ roster: ['阿明', '小華', '小美', '大雄'] })
    act(() => {
      window.location.hash = '#/new'
    })
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: '7' }))
    fireEvent.click(screen.getByRole('button', { name: /從名冊選擇/ }))
    const dialog = screen.getByRole('dialog')
    for (const n of ['小華', '阿明']) {
      fireEvent.click(within(dialog).getByRole('button', { name: n }))
    }
    expect(dialog.textContent).toContain('已選 2 人')
    fireEvent.click(within(dialog).getByRole('button', { name: /完成/ }))
    expect([1, 2, 3, 7].map(seat)).toEqual(['小華', '阿明', '', ''])
    expect(screen.getByRole('radio', { name: '7' })).toHaveProperty('checked', true)
  })
})
