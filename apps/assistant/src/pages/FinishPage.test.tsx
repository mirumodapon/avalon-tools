import { decodeGame } from '@avalon/record-core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../App.tsx'
import { useSession } from '../session/store.ts'
import { completeQuest, newGame, startSession } from '../test/game.ts'

const click = (name: string | RegExp) =>
  act(() => fireEvent.click(screen.getByRole('button', { name })))

/** Three successful quests: the assassin's turn. */
const goodWon = () => completeQuest(completeQuest(completeQuest(newGame())))

describe('end of the game', () => {
  beforeEach(() => {
    localStorage.clear()
    useSession.getState().clear()
  })

  it('lets the assassin name a target and shows who won', () => {
    startSession(goodWon())
    render(<App />)
    expect(screen.getByText('刺客指認')).toBeTruthy()
    click('1 號')
    click('刺殺')
    click('確定')
    expect(useSession.getState().session!.stage).toBe('finished')
    expect(screen.getByText('壞人獲勝')).toBeTruthy()
    expect(screen.getByText('刺中梅林')).toBeTruthy()
    expect(screen.getByText('梅林')).toBeTruthy()
  })

  it('shows good winning when the assassin misses', () => {
    startSession(goodWon())
    render(<App />)
    click('4 號')
    click('刺殺')
    click('確定')
    expect(screen.getByText('好人獲勝')).toBeTruthy()
    expect(screen.getByText('沒刺中梅林')).toBeTruthy()
  })

  it('hands the game to the record app in a new tab', async () => {
    startSession(goodWon())
    render(<App />)
    click('4 號')
    click('刺殺')
    click('確定')
    const link = await screen.findByRole('link', { name: /加入遊戲紀錄/ })
    expect(link.getAttribute('target')).toBe('_blank')
    const href = new URL(link.getAttribute('href')!)
    expect(href.pathname).toBe('/record/')
    const back = await decodeGame(href.searchParams.get('s')!)
    expect(back.rounds).toEqual(useSession.getState().session!.game.rounds)
    expect(back.assassination).toEqual(useSession.getState().session!.game.assassination)
  })

  it('starts a new game only after confirming', () => {
    startSession(goodWon())
    render(<App />)
    click('4 號')
    click('刺殺')
    click('確定')
    click('新遊戲')
    expect(useSession.getState().session).not.toBeNull()
    click('開始新遊戲')
    expect(useSession.getState().session).toBeNull()
  })
})
