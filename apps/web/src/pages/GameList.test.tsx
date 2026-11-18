import {
  createGame,
  defaultPlayerNames,
  defaultRoleConfig,
  deriveState,
  gameReducer,
  makePlayers,
  uniformVotes,
  type Game,
} from '@avalon/core'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../App.tsx'
import { MemoryGameRepository } from '../db/memory.ts'
import { setRepository, useGames } from '../games/store.ts'
import { useSettings } from '../settings/store.ts'

const ids = ['p1', 'p2', 'p3', 'p4', 'p5']

function finished(id: string, custom: string, note = ''): Game {
  let g = createGame({
    id,
    now: new Date().toISOString(),
    players: makePlayers(['阿明', '小華', '小美', '大雄', '靜香']),
    name: { custom, seq: 1 },
    note,
    roleConfig: defaultRoleConfig(5),
    roleAssignment: { p1: 'merlin' },
  })
  for (const size of [2, 3, 2]) {
    g = gameReducer(g, {
      type: 'propose',
      team: ids.slice(0, size),
      votes: uniformVotes(ids, 'approve'),
      inputMode: 'approvals',
    })
    g = gameReducer(g, { type: 'recordQuest', failCount: 1 })
  }
  return { ...g, savedAt: g.updatedAt }
}

function go(hash: string) {
  act(() => {
    window.location.hash = hash
  })
}

beforeEach(() => setRepository(new MemoryGameRepository()))
afterEach(() => {
  go('')
  setRepository(null)
  useGames.setState({ games: [] })
  useSettings.getState().reset()
})

describe('game list', () => {
  it('searches by name and note', () => {
    useGames.setState({ games: [finished('a', '週五團', '在咖啡廳'), finished('b', '週六團')] })
    render(<App />)
    fireEvent.change(screen.getByRole('textbox', { name: '搜尋名稱或備註' }), {
      target: { value: '咖啡' },
    })
    const list = screen.getByRole('region', { name: '遊戲列表' })
    expect(within(list).getByRole('button', { name: '週五團' })).toBeTruthy()
    expect(within(list).queryByRole('button', { name: '週六團' })).toBeNull()
  })

  it('opens the share panel from the item menu', async () => {
    useGames.setState({ games: [finished('a', '週五團')] })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '週五團 的選項' }))
    fireEvent.click(screen.getByRole('button', { name: /^分享$/ }))
    const panel = await screen.findByRole('dialog', { name: '分享連結' })
    expect(
      within(panel).getByRole<HTMLTextAreaElement>('textbox', { name: '分享連結' }).value,
    ).toMatch(/\?s=[zj]/)
    expect(screen.queryByRole('dialog', { name: '週五團' })).toBeNull()
  })

  it('asks before deleting', async () => {
    useGames.setState({ games: [finished('a', '週五團')] })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '週五團 的選項' }))
    fireEvent.click(screen.getByRole('button', { name: /刪除/ }))
    expect(useGames.getState().games).toHaveLength(1)
    const dialog = screen.getByRole('dialog', { name: '刪除遊戲？' })
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: '刪除' }))
    })
    expect(useGames.getState().games).toHaveLength(0)
  })

  it('copies a game as a new one with players and role config but no assignment', () => {
    useGames.setState({ games: [finished('a', '週五團')] })
    go('#/new/a')
    render(<App />)
    expect(screen.getByRole('heading', { name: '複製為新局' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /開始遊戲/ }))
    const created = useGames.getState().games.find((g) => g.id !== 'a')!
    expect(created.players.map((p) => p.name)).toEqual(['阿明', '小華', '小美', '大雄', '靜香'])
    expect(created.roleConfig).toEqual(defaultRoleConfig(5))
    expect(created.roleAssignment).toEqual({})
  })
})

describe('settlement', () => {
  it('saves the game and moves to its detail page', () => {
    const g = { ...finished('a', ''), savedAt: null, name: { custom: null, auto: '', seq: 2 } }
    expect(deriveState(g).winner).toBe('evil')
    useGames.setState({ games: [g] })
    useSettings
      .getState()
      .update({ naming: { template: '第{seq}場 {winner}勝', dateFormat: 'YYYY-MM-DD' } })
    go('#/summary/a')
    render(<App />)
    expect(screen.getByText('壞人勝利')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /保存/ }))
    const saved = useGames.getState().games[0]!
    expect(saved.savedAt).not.toBeNull()
    expect(saved.name.auto).toBe('第2場 壞人勝')
    expect(window.location.hash).toBe('#/game/a')
  })
})

describe('in-progress games', () => {
  it('are listed for resuming', () => {
    const g = createGame({
      id: 'x',
      now: new Date().toISOString(),
      players: makePlayers(defaultPlayerNames(5)),
      name: { custom: '進行中的局' },
    })
    useGames.setState({ games: [g] })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '繼續：進行中的局' }))
    expect(window.location.hash).toBe('#/play/x')
  })
})
