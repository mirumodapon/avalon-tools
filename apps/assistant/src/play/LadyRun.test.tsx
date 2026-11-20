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
    expect(screen.getByText('3 號')).toBeTruthy()
    hold('長按選擇要亮出的身分')
    click('壞人')
    expect(screen.getByText('7 號')).toBeTruthy()
    hold('長按查看對方的身分')
    doubleTap(/雙擊蓋上/)
    expect(screen.getByText('請 7 號 公開宣告')).toBeTruthy()
    click('宣告壞人')
    const uses = useSession.getState().session!.game.lady!.uses
    expect(uses).toEqual([
      { afterQuest: 1, holderId: 'p7', targetId: 'p3', declared: 'evil', note: '' },
    ])
  })

  it('goes back to choosing the target after a reload', () => {
    startSession(ladyTime())
    const { unmount } = render(<App />)
    click('3 號')
    click('查驗')
    hold('長按選擇要亮出的身分')
    unmount()
    render(<App />)
    expect(screen.getByText('湖中女神持有者：7 號')).toBeTruthy()
    expect(useSession.getState().session!.game.lady!.uses).toHaveLength(0)
  })
})
