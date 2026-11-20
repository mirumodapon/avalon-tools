import { createGame, defaultPlayerNames, makePlayers } from '@avalon/record-core'
import { beforeEach, describe, expect, it } from 'vitest'
import { SESSION_STORE, useSession } from './store.ts'

function game() {
  return createGame({
    id: 'g1',
    now: '2026-11-20T12:00:00.000Z',
    players: makePlayers(defaultPlayerNames(5)),
  })
}

describe('session store', () => {
  beforeEach(() => {
    localStorage.clear()
    useSession.getState().clear()
  })

  it('persists only the game, vote mode and stage', () => {
    useSession.getState().start({ game: game(), voteMode: 'pass', stage: 'deal' })
    const env = JSON.parse(localStorage.getItem(SESSION_STORE.key)!) as {
      data: Record<string, unknown>
    }
    expect(Object.keys(env.data).toSorted()).toEqual(['game', 'stage', 'voteMode'])
  })

  it('applies game actions and saves the result', () => {
    useSession.getState().start({ game: game(), voteMode: 'leader', stage: 'play' })
    useSession.getState().apply({ type: 'setNote', note: '測試' })
    expect(useSession.getState().session!.game.note).toBe('測試')
    expect(SESSION_STORE.parse(JSON.parse(localStorage.getItem(SESSION_STORE.key)!).data)).toEqual(
      useSession.getState().session,
    )
  })

  it('clears the saved game', () => {
    useSession.getState().start({ game: game(), voteMode: 'pass', stage: 'deal' })
    useSession.getState().clear()
    expect(localStorage.getItem(SESSION_STORE.key)).toBeNull()
    expect(useSession.getState().session).toBeNull()
  })

  it('treats a corrupt saved game as no game', () => {
    expect(SESSION_STORE.parse({ game: { nope: 1 }, voteMode: 'pass', stage: 'play' })).toBeNull()
  })
})
