import { decodeGame, deriveState, playerFaction } from '@avalon/record-core'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App.tsx'
import { useSession } from './session/store.ts'
import { useSetup } from './setup/settings.ts'
import { doubleTap, hold, usePassTimers } from './test/pass.ts'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    useSession.getState().clear()
    useSetup.getState().update({ playerCount: 5, names: ['小明', '', '', '', ''] })
  })

  it('starts a game and passes the phone to seat 1', () => {
    render(<App />)
    act(() => fireEvent.click(screen.getByRole('button', { name: /開始遊戲/ })))
    expect(screen.getByText(/請將手機交給/)).toBeTruthy()
    expect(screen.getByText('1 號・小明')).toBeTruthy()
    expect(useSession.getState().session?.stage).toBe('deal')
  })

  it('lets the Lady start with any seat, the last one by default', () => {
    useSetup.getState().update({ playerCount: 7, lady: true, ladyHolderSeat: null })
    render(<App />)
    act(() => fireEvent.click(screen.getByRole('button', { name: '湖中女神初始持有者：7 號' })))
    const dialog = screen.getByRole('dialog', { name: '湖中女神初始持有者' })
    act(() => fireEvent.click(within(dialog).getByRole('button', { name: '2 號' })))
    act(() => fireEvent.click(screen.getByRole('button', { name: /開始遊戲/ })))
    expect(useSession.getState().session!.game.lady!.initialHolderId).toBe('p2')
  })

  it('hides the holder choice when the holder is drawn at random', () => {
    useSetup.getState().update({ playerCount: 7, lady: true, ladyHolderRandom: false })
    render(<App />)
    act(() => fireEvent.click(screen.getByRole('switch', { name: /隨機決定初始持有者/ })))
    expect(useSetup.getState().settings.ladyHolderRandom).toBe(true)
    expect(screen.queryByRole('button', { name: /湖中女神初始持有者/ })).toBeNull()
  })

  it('asks before abandoning a game', () => {
    render(<App />)
    act(() => fireEvent.click(screen.getByRole('button', { name: /開始遊戲/ })))
    act(() => fireEvent.click(screen.getByRole('button', { name: '放棄這場' })))
    act(() => fireEvent.click(screen.getByRole('button', { name: '放棄' })))
    expect(useSession.getState().session).toBeNull()
    expect(screen.getByRole('button', { name: /開始遊戲/ })).toBeTruthy()
  })

  describe('dealing', () => {
    beforeEach(usePassTimers)
    afterEach(() => vi.useRealTimers())

    it('moves on to the rounds once every seat has seen their card', () => {
      render(<App />)
      act(() => fireEvent.click(screen.getByRole('button', { name: /開始遊戲/ })))
      for (let seat = 1; seat <= 5; seat++) {
        expect(screen.getByText(seat === 1 ? '1 號・小明' : `${seat} 號`)).toBeTruthy()
        hold()
        doubleTap()
      }
      expect(useSession.getState().session?.stage).toBe('play')
    })

    it('starts again from seat 1 after a reload', () => {
      const { unmount } = render(<App />)
      act(() => fireEvent.click(screen.getByRole('button', { name: /開始遊戲/ })))
      hold()
      doubleTap()
      expect(screen.getByText('2 號')).toBeTruthy()
      unmount()
      render(<App />)
      expect(screen.getByText('1 號・小明')).toBeTruthy()
    })
  })

  describe('a whole game', () => {
    beforeEach(usePassTimers)
    afterEach(() => vi.useRealTimers())

    it('plays from setup to the hand-off: good completes three quests, the assassin misses', async () => {
      useSetup.getState().update({ voteMode: 'leader', lady: false })
      render(<App />)
      click(/開始遊戲/)
      for (let seat = 1; seat <= 5; seat++) {
        hold()
        doubleTap()
      }
      for (let quest = 0; quest < 3; quest++) {
        const game = useSession.getState().session!.game
        const { teamSize } = deriveState(game)
        for (const p of game.players.slice(0, teamSize)) click(seatLabelOf(p.name, p.id))
        click('送出組隊')
        click('確定')
        // 派票: mark everyone as approving.
        for (const p of game.players) click(new RegExp(`^${seatLabelOf(p.name, p.id)}`))
        click('送出投票')
        click('確定')
        click('繼續')
        for (let i = 0; i < teamSize; i++) {
          hold('長按出牌')
          // Good players see two 任務成功 buttons; either one plays it.
          act(() => fireEvent.click(screen.getAllByRole('button', { name: '任務成功' })[0]!))
        }
        hold('長按公布結果')
        click('繼續')
      }
      const game = useSession.getState().session!.game
      const merlin = Object.entries(game.roleAssignment).find(([, r]) => r === 'merlin')![0]
      // A good player who isn't Merlin (evil teammates can't be picked).
      const miss = game.players.find(
        (p) => p.id !== merlin && playerFaction(game, p.id) === 'good',
      )!
      click(seatLabelOf(miss.name, miss.id))
      click('刺殺')
      click('確定')
      expect(screen.getByText('好人獲勝')).toBeTruthy()
      // The share link is built asynchronously (compression): wait on real timers.
      vi.useRealTimers()
      const link = await screen.findByRole('link', { name: /加入遊戲紀錄/ })
      const href = link.getAttribute('href')!
      const back = await decodeGame(new URL(href).searchParams.get('s')!)
      expect(deriveState(back).winner).toBe('good')
      expect(back.rounds).toHaveLength(3)
    })
  })
})

const click = (name: string | RegExp) =>
  act(() => fireEvent.click(screen.getByRole('button', { name })))

/** The seat button text: `1 號・小明` or `2 號`. */
function seatLabelOf(name: string, id: string): string {
  const seat = id.slice(1)
  return name === `${seat}號` ? `${seat} 號` : `${seat} 號・${name}`
}
