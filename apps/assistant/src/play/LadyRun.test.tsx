import { deriveState } from '@avalon/record-core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App.tsx'
import { useSession } from '../session/store.ts'
import { completeQuest, newGame, startSession } from '../test/game.ts'
import { doubleTap, hold, usePassTimers } from '../test/pass.ts'

/** 7 players, the Lady starting with seat 7, two quests done: time for the Lady. */
const ladyTime = () => completeQuest(completeQuest(newGame(7, true)))

const click = (name: string | RegExp) =>
  act(() => fireEvent.click(screen.getByRole('button', { name })))

describe('Lady of the Lake', () => {
  beforeEach(() => {
    localStorage.clear()
    useSession.getState().clear()
    usePassTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('lets the holder inspect someone and records the public declaration', () => {
    const game = ladyTime()
    expect(deriveState(game).phase).toBe('lady')
    startSession(game)
    render(<App />)
    expect(screen.getByText('湖中女神持有者：7 號')).toBeTruthy()
    expect(screen.getByRole('button', { name: /7 號/ }).hasAttribute('disabled')).toBe(true)
    click('3 號')
    click('查驗')
    // No choice for the inspected player: the holder sees their real faction.
    expect(screen.queryByRole('button', { name: /長按選擇要亮出的身分/ })).toBeNull()
    hold('長按查看 3 號的陣營')
    expect(screen.getByText('3 號的真實陣營')).toBeTruthy()
    expect(screen.getByText('壞人')).toBeTruthy()
    doubleTap(/雙擊蓋上/)
    expect(screen.getByText('請 7 號 公開宣告')).toBeTruthy()
    click('宣告壞人')
    const uses = useSession.getState().session!.game.lady!.uses
    expect(uses).toEqual([
      { afterQuest: 1, holderId: 'p7', targetId: 'p3', declared: 'evil', note: '' },
    ])
  })

  it('shows a good player as good', () => {
    startSession(ladyTime())
    render(<App />)
    click('5 號')
    click('查驗')
    hold('長按查看 5 號的陣營')
    expect(screen.getByText('好人')).toBeTruthy()
  })

  it('goes back to choosing the target after a reload', () => {
    startSession(ladyTime())
    const { unmount } = render(<App />)
    click('3 號')
    click('查驗')
    hold('長按查看 3 號的陣營')
    unmount()
    render(<App />)
    expect(screen.getByText('湖中女神持有者：7 號')).toBeTruthy()
    expect(useSession.getState().session!.game.lady!.uses).toHaveLength(0)
  })
})
