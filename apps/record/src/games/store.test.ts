import { createGame, defaultPlayerNames, makePlayers, uniformVotes } from '@avalon/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryGameRepository } from '../db/memory.ts'
import { flushPendingSaves, SAVE_DEBOUNCE_MS, setRepository, useGames } from './store.ts'

let repo: MemoryGameRepository
const game = () =>
  createGame({ id: 'g', now: '2026-11-18T10:00:00Z', players: makePlayers(defaultPlayerNames(5)) })
const ids = ['p1', 'p2', 'p3', 'p4', 'p5']

beforeEach(() => {
  repo = new MemoryGameRepository()
  setRepository(repo)
  useGames.setState({ games: [], ready: false })
})
afterEach(() => {
  setRepository(null)
  vi.useRealTimers()
})

describe('games store persistence', () => {
  it('loads games from the repository', async () => {
    await repo.put(game())
    await useGames.getState().load()
    expect(useGames.getState()).toMatchObject({
      ready: true,
      games: [expect.objectContaining({ id: 'g' })],
    })
  })

  it('writes new games immediately and debounces edits', async () => {
    vi.useFakeTimers()
    useGames.getState().add(game())
    await vi.runAllTimersAsync()
    expect(repo.writes).toBe(1)
    const { dispatch } = useGames.getState()
    dispatch('g', {
      type: 'propose',
      team: ['p1', 'p2'],
      votes: uniformVotes(ids, 'reject'),
      inputMode: 'approvals',
    })
    dispatch('g', {
      type: 'propose',
      team: ['p1', 'p2'],
      votes: uniformVotes(ids, 'reject'),
      inputMode: 'approvals',
    })
    expect(repo.writes).toBe(1)
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS)
    expect(repo.writes).toBe(2)
    expect(repo.data.get('g')!.rounds[0]!.proposals).toHaveLength(2)
  })

  it('flushes pending saves on demand', async () => {
    vi.useFakeTimers()
    useGames.getState().add(game())
    await vi.runAllTimersAsync()
    useGames.getState().dispatch('g', { type: 'setNote', note: '最後一步' })
    await flushPendingSaves()
    expect(repo.data.get('g')!.note).toBe('最後一步')
  })

  it('survives a reload (simulated refresh)', async () => {
    useGames.getState().add(game())
    useGames.getState().dispatch('g', { type: 'setNote', note: '進行中' })
    await flushPendingSaves()
    useGames.setState({ games: [], ready: false })
    await useGames.getState().load()
    expect(useGames.getState().games[0]!.note).toBe('進行中')
  })

  it('reports write failures', async () => {
    repo.put = () => Promise.reject(new Error('disk full'))
    useGames.getState().add(game())
    await vi.waitFor(() => expect(useGames.getState().storageError).toContain('disk full'))
  })

  it('removes games from storage', async () => {
    useGames.getState().add(game())
    await flushPendingSaves()
    await useGames.getState().remove('g')
    expect(repo.data.size).toBe(0)
  })
})
