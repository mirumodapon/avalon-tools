import { gameReducer, uniformVotes } from '@avalon/record-core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App.tsx'
import { useSession } from '../session/store.ts'
import { newGame, startSession } from '../test/game.ts'
import { hold, usePassTimers } from '../test/pass.ts'

/** A 5-player game whose first team (seats 2 and 4) has just been approved. */
function onQuest() {
  const g = newGame()
  const ids = g.players.map((p) => p.id)
  return gameReducer(g, {
    type: 'propose',
    team: ['p2', 'p4'],
    votes: uniformVotes(ids, 'approve'),
    inputMode: 'approvals',
  })
}

const click = (name: string | RegExp) =>
  act(() => fireEvent.click(screen.getByRole('button', { name })))

describe('quest', () => {
  beforeEach(() => {
    localStorage.clear()
    useSession.getState().clear()
    usePassTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('passes the phone to each team member, then records the fails', () => {
    startSession(onQuest())
    render(<App />)
    expect(screen.getByText('2 號')).toBeTruthy()
    hold('長按出牌')
    click('任務成功')
    expect(screen.getByText('4 號')).toBeTruthy()
    hold('長按出牌')
    click('任務失敗')
    hold('長按公布結果')
    expect(screen.getByText('1 張失敗')).toBeTruthy()
    click('繼續')
    expect(useSession.getState().session!.game.rounds[0]!.result).toEqual({ failCount: 1 })
  })

  it('starts the quest over after a reload', () => {
    startSession(onQuest())
    const { unmount } = render(<App />)
    hold('長按出牌')
    click('任務失敗')
    unmount()
    render(<App />)
    expect(screen.getByText('2 號')).toBeTruthy()
    expect(useSession.getState().session!.game.rounds[0]!.result).toBeNull()
  })
})
