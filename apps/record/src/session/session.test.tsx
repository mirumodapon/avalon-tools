import { createGame, defaultPlayerNames, makePlayers } from '@avalon/record-core'
import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useGames } from '../games/store.ts'
import { PlayPage } from '../pages/PlayPage.tsx'
import { hashToRestore } from './session.ts'
import { usePersistentState } from './usePersistentState.ts'

const saved = (hash: string) => ({ hash, scroll: {} })
const at = (hash: string, search = '') => ({ hash, search })

describe('hashToRestore', () => {
  it('reopens the installed app on the last screen', () => {
    expect(hashToRestore(at(''), saved('#/play/g1'), true)).toBe('#/play/g1')
    expect(hashToRestore(at('#/'), saved('#/settings'), true)).toBe('#/settings')
  })
  it('leaves explicit routes, share links, browser tabs and home alone', () => {
    expect(hashToRestore(at('#/game/g2'), saved('#/play/g1'), true)).toBeNull()
    expect(hashToRestore(at('', '?s=jabc'), saved('#/play/g1'), true)).toBeNull()
    expect(hashToRestore(at(''), saved('#/play/g1'), false)).toBeNull()
    expect(hashToRestore(at(''), saved('#/'), true)).toBeNull()
  })
})

describe('usePersistentState', () => {
  it('survives a remount with the same key and starts fresh for a new key', () => {
    const a = renderHook(() => usePersistentState('test', 'k1', 0))
    act(() => a.result.current[1](5))
    a.unmount()
    expect(renderHook(() => usePersistentState('test', 'k1', 0)).result.current[0]).toBe(5)
    expect(renderHook(() => usePersistentState('test', 'k2', 0)).result.current[0]).toBe(0)
  })
})

const region = () => screen.getByRole('region', { name: '選擇隊員' })

afterEach(() => useGames.setState({ games: [] }))

describe('reopening mid-entry', () => {
  it('keeps the half-entered proposal after the app is closed and reopened', () => {
    const game = createGame({
      id: 'g',
      now: '2026-11-18T10:00:00Z',
      players: makePlayers(defaultPlayerNames(5)),
    })
    useGames.setState({ games: [game] })
    const first = render(<PlayPage id="g" />)
    fireEvent.click(within(region()).getByRole('button', { name: /^\d+\s*2號/ }))
    fireEvent.click(within(region()).getByRole('button', { name: /^\d+\s*4號/ }))
    fireEvent.click(screen.getByRole('button', { name: /下一步/ }))
    fireEvent.click(screen.getByRole('button', { name: /^3號，/ }))
    first.unmount() // app closed

    render(<PlayPage id="g" />) // reopened
    expect(screen.getByRole('region', { name: '記錄投票' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^3號，非隊員，贊成/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /送出派票/ }))
    const p = useGames.getState().games[0]!.rounds[0]!.proposals[0]!
    expect(p.team).toEqual(['p2', 'p4'])
    // the next proposal starts empty
    expect(screen.getByText('0/2')).toBeTruthy()
  })
})
