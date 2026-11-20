import { act, fireEvent, render, screen } from '@testing-library/react'
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
})
