import { deriveState } from '@avalon/record-core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App.tsx'
import { useSession } from '../session/store.ts'
import { newGame, reject, startSession } from '../test/game.ts'
import { hold, usePassTimers } from '../test/pass.ts'

const click = (name: string | RegExp) =>
  act(() => fireEvent.click(screen.getByRole('button', { name })))

function proposeTeam(...seats: string[]) {
  for (const s of seats) click(s)
  click('送出組隊')
  click('確定')
}

describe('voting', () => {
  beforeEach(() => {
    localStorage.clear()
    useSession.getState().clear()
  })

  it('ends the game when the forced proposal is rejected', () => {
    startSession(reject(newGame(), 4), 'leader')
    render(<App />)
    expect(screen.getByText('強制局')).toBeTruthy()
    proposeTeam('1 號', '2 號')
    click('送出投票')
    click('確定')
    expect(screen.getByText('否決')).toBeTruthy()
    click('繼續')
    const { game, stage } = useSession.getState().session!
    expect(deriveState(game).winReason).toBe('forced-rejected')
    expect(stage).toBe('finished')
  })

  it('records the votes the leader entered', () => {
    startSession(newGame(), 'leader')
    render(<App />)
    proposeTeam('1 號', '2 號')
    for (const s of [/^1 號/, /^2 號/, /^3 號/]) click(s)
    click('送出投票')
    click('確定')
    expect(screen.getByText('通過')).toBeTruthy()
    click('繼續')
    const proposal = useSession.getState().session!.game.rounds[0]!.proposals[0]!
    expect(proposal.team).toEqual(['p1', 'p2'])
    expect(proposal.votes).toEqual({
      p1: 'approve',
      p2: 'approve',
      p3: 'approve',
      p4: 'reject',
      p5: 'reject',
    })
  })

  describe('passing the phone', () => {
    beforeEach(usePassTimers)
    afterEach(() => vi.useRealTimers())

    it('collects every vote from the leader round the table', () => {
      startSession(newGame(), 'pass')
      render(<App />)
      proposeTeam('1 號', '2 號')
      for (const seat of ['1 號', '2 號', '3 號', '4 號', '5 號']) {
        expect(screen.getByText(seat)).toBeTruthy()
        hold('長按投票')
        click(seat === '5 號' ? '反對' : '同意')
      }
      hold('長按公布投票結果')
      expect(screen.getByText('通過')).toBeTruthy()
      click('繼續')
      expect(useSession.getState().session!.game.rounds[0]!.proposals[0]!.votes.p5).toBe('reject')
    })

    it('resumes a pass vote with the next voter after a reload', () => {
      startSession(newGame(), 'pass')
      const { unmount } = render(<App />)
      proposeTeam('1 號', '2 號')
      hold('長按投票')
      click('反對')
      unmount()
      render(<App />)
      expect(screen.getByText('2 號')).toBeTruthy()
      for (let i = 0; i < 4; i++) {
        hold('長按投票')
        click('同意')
      }
      hold('長按公布投票結果')
      click('繼續')
      const votes = useSession.getState().session!.game.rounds[0]!.proposals[0]!.votes
      expect(votes).toEqual({
        p1: 'reject',
        p2: 'approve',
        p3: 'approve',
        p4: 'approve',
        p5: 'approve',
      })
    })
  })

  it('comes back to the vote after a reload once the team is chosen', () => {
    startSession(newGame(), 'leader')
    const { unmount } = render(<App />)
    proposeTeam('1 號', '2 號')
    unmount()
    render(<App />)
    expect(screen.getByRole('button', { name: '送出投票' })).toBeTruthy()
  })

  it('comes back to the vote result after a reload', () => {
    startSession(newGame(), 'leader')
    const { unmount } = render(<App />)
    proposeTeam('1 號', '2 號')
    for (const s of [/^1 號/, /^2 號/, /^3 號/]) click(s)
    click('送出投票')
    click('確定')
    unmount()
    render(<App />)
    expect(screen.getByText('通過')).toBeTruthy()
  })
})
