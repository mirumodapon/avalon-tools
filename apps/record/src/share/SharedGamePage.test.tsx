import {
  createGame,
  defaultPlayerNames,
  gameReducer,
  makePlayers,
  uniformVotes,
} from '@avalon/record-core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../App.tsx'
import { MemoryGameRepository } from '../db/memory.ts'
import { setRepository, useGames } from '../games/store.ts'
import { encodeGame } from './link.ts'

function shared() {
  let g = createGame({
    id: '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f',
    now: '2026-11-18T12:00:00.000Z',
    players: makePlayers(defaultPlayerNames(5)),
    name: { custom: '朋友的局', seq: 2 },
  })
  const ids = g.players.map((p) => p.id)
  g = gameReducer(g, {
    type: 'propose',
    team: ['p1', 'p2'],
    votes: uniformVotes(ids, 'approve'),
    inputMode: 'approvals',
  })
  return g
}

let repo: MemoryGameRepository
beforeEach(() => {
  repo = new MemoryGameRepository()
  setRepository(repo)
})
afterEach(() => {
  window.history.replaceState(null, '', '/')
  setRepository(null)
  useGames.setState({ games: [] })
})

async function open(param: string) {
  window.history.replaceState(null, '', `/?s=${param}`)
  render(<App />)
  await screen.findByText(/別人分享給你的紀錄|無法開啟這個分享連結/)
}

describe('shared link', () => {
  it('previews and imports a shared game', async () => {
    await open(await encodeGame(shared()))
    expect(screen.getByRole('heading', { name: '朋友的局' })).toBeTruthy()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /匯入到本機/ }))
    })
    expect(repo.data.get(shared().id)?.name.custom).toBe('朋友的局')
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe(`#/game/${shared().id}`)
  })

  it('exports straight from the link without saving the game', async () => {
    await open(await encodeGame(shared()))
    fireEvent.click(screen.getByRole('button', { name: /^匯出$/ }))
    expect(screen.getByRole('heading', { name: '匯出' })).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: '純文字' }))
    expect((screen.getByRole('textbox', { name: '預覽' }) as HTMLTextAreaElement).value).toContain(
      '朋友的局',
    )
    expect(repo.data.size).toBe(0)
    expect(useGames.getState().games).toEqual([])
    expect(window.location.search).toContain('s=')
  })

  it('asks what to do when the game already exists', async () => {
    useGames.setState({ games: [shared()] })
    await repo.put(shared())
    await open(await encodeGame(shared()))
    expect(screen.getByText('本機已有這場紀錄')).toBeTruthy()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /匯入到本機/ }))
    })
    expect(useGames.getState().games).toHaveLength(2)
  })

  it('explains broken links', async () => {
    await open('zbroken')
    expect(screen.getByText('無法開啟這個分享連結')).toBeTruthy()
  })
})
