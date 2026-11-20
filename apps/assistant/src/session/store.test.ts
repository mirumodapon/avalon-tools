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

  it('persists the game, vote mode, stage and the step in progress', () => {
    useSession.getState().start({ game: game(), voteMode: 'pass', stage: 'deal', progress: null })
    const env = JSON.parse(localStorage.getItem(SESSION_STORE.key)!) as {
      data: Record<string, unknown>
    }
    expect(Object.keys(env.data).toSorted()).toEqual(['game', 'progress', 'stage', 'voteMode'])
  })

  it('saves the step in progress so it survives a reload', () => {
    useSession.getState().start({ game: game(), voteMode: 'pass', stage: 'play', progress: null })
    useSession.getState().setProgress({ kind: 'team', team: ['p1', 'p2'], cast: ['approve'] })
    const saved = SESSION_STORE.parse(JSON.parse(localStorage.getItem(SESSION_STORE.key)!).data)
    expect(saved!.progress).toEqual({ kind: 'team', team: ['p1', 'p2'], cast: ['approve'] })
  })

  it('drops the step in progress once something is recorded or the stage changes', () => {
    useSession.getState().start({ game: game(), voteMode: 'pass', stage: 'deal', progress: null })
    useSession.getState().setProgress({ kind: 'deal', seen: 2 })
    useSession.getState().setStage('play')
    expect(useSession.getState().session!.progress).toBeNull()
    useSession.getState().setProgress({ kind: 'team', team: ['p1', 'p2'], cast: [] })
    useSession.getState().apply({ type: 'setNote', note: 'x' })
    expect(useSession.getState().session!.progress).toBeNull()
  })

  it('ignores an unreadable step in progress', () => {
    const data = { game: game(), voteMode: 'pass', stage: 'play', progress: { kind: 'nope' } }
    expect(SESSION_STORE.parse(data)!.progress).toBeNull()
  })

  it('applies game actions and saves the result', () => {
    useSession.getState().start({ game: game(), voteMode: 'leader', stage: 'play', progress: null })
    useSession.getState().apply({ type: 'setNote', note: '測試' })
    expect(useSession.getState().session!.game.note).toBe('測試')
    expect(SESSION_STORE.parse(JSON.parse(localStorage.getItem(SESSION_STORE.key)!).data)).toEqual(
      useSession.getState().session,
    )
  })

  it('clears the saved game', () => {
    useSession.getState().start({ game: game(), voteMode: 'pass', stage: 'deal', progress: null })
    useSession.getState().clear()
    expect(localStorage.getItem(SESSION_STORE.key)).toBeNull()
    expect(useSession.getState().session).toBeNull()
  })

  it('treats a corrupt saved game as no game', () => {
    expect(SESSION_STORE.parse({ game: { nope: 1 }, voteMode: 'pass', stage: 'play' })).toBeNull()
  })
})
