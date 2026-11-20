import { gameReducer, parseGame, type GameAction } from '@avalon/record-core'
import { readStore, removeStore, writeStore, type StoreSpec } from '@avalon/storage'
import { create } from 'zustand'
import { key } from '../storage.ts'
import type { Session, Stage } from './types.ts'

const STAGES: readonly Stage[] = ['deal', 'play', 'finished']

function parseSession(data: unknown): Session | null {
  if (typeof data !== 'object' || data === null) return null
  const d = data as Partial<Record<keyof Session, unknown>>
  const parsed = parseGame(d.game)
  if (!parsed.ok) return null
  return {
    game: parsed.game,
    voteMode: d.voteMode === 'leader' ? 'leader' : 'pass',
    stage: STAGES.includes(d.stage as Stage) ? (d.stage as Stage) : 'play',
  }
}

export const SESSION_STORE: StoreSpec<Session | null> = {
  key: key('session'),
  version: 1,
  parse: parseSession,
  fallback: () => null,
}

function save(session: Session): Session {
  writeStore(SESSION_STORE, {
    game: session.game,
    voteMode: session.voteMode,
    stage: session.stage,
  })
  return session
}

export const useSession = create<{
  session: Session | null
  start: (session: Session) => void
  /** Applies a game action and saves; a GameRuleError propagates to the caller. */
  apply: (action: GameAction) => void
  setStage: (stage: Stage) => void
  clear: () => void
}>()((set, get) => {
  const current = () => {
    const session = get().session
    if (!session) throw new Error('沒有進行中的遊戲')
    return session
  }
  return {
    session: readStore(SESSION_STORE),
    start: (session) => set({ session: save(session) }),
    apply: (action) => {
      const session = current()
      set({ session: save({ ...session, game: gameReducer(session.game, action) }) })
    },
    setStage: (stage) => set({ session: save({ ...current(), stage }) }),
    clear: () => {
      removeStore(SESSION_STORE.key)
      set({ session: null })
    },
  }
})
