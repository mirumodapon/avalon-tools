import { gameReducer, parseGame, type GameAction } from '@avalon/record-core'
import { readStore, removeStore, writeStore, type StoreSpec } from '@avalon/storage'
import { create } from 'zustand'
import { key } from '../storage.ts'
import type { Progress, Session, Stage } from './types.ts'

const STAGES: readonly Stage[] = ['deal', 'play', 'finished']

const isList = (v: unknown): v is unknown[] => Array.isArray(v)
const isStrings = (v: unknown): v is string[] => isList(v) && v.every((x) => typeof x === 'string')

/** A saved step in progress, or null when it is missing or unreadable. */
function parseProgress(data: unknown): Progress | null {
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>
  switch (d.kind) {
    case 'deal':
      return Number.isInteger(d.seen) ? { kind: 'deal', seen: d.seen as number } : null
    case 'team':
      return isStrings(d.team) && isStrings(d.cast)
        ? {
            kind: 'team',
            team: d.team,
            cast: d.cast as Extract<Progress, { kind: 'team' }>['cast'],
          }
        : null
    case 'voted':
      return isStrings(d.team) && typeof d.votes === 'object' && d.votes !== null
        ? {
            kind: 'voted',
            team: d.team,
            votes: d.votes as Extract<Progress, { kind: 'voted' }>['votes'],
            inputMode: d.inputMode === 'anomalies' ? 'anomalies' : 'approvals',
          }
        : null
    case 'quest':
      return isStrings(d.played)
        ? {
            kind: 'quest',
            played: d.played as Extract<Progress, { kind: 'quest' }>['played'],
            revealed: d.revealed === true,
          }
        : null
    case 'lady':
      return typeof d.target === 'string'
        ? { kind: 'lady', target: d.target, seen: d.seen === true }
        : null
    default:
      return null
  }
}

function parseSession(data: unknown): Session | null {
  if (typeof data !== 'object' || data === null) return null
  const d = data as Partial<Record<keyof Session, unknown>>
  const parsed = parseGame(d.game)
  if (!parsed.ok) return null
  return {
    game: parsed.game,
    voteMode: d.voteMode === 'leader' ? 'leader' : 'pass',
    forcedVote: d.forcedVote === true,
    stage: STAGES.includes(d.stage as Stage) ? (d.stage as Stage) : 'play',
    progress: parseProgress(d.progress),
  }
}

export const SESSION_STORE: StoreSpec<Session | null> = {
  key: key('session'),
  version: 1,
  parse: parseSession,
  fallback: () => null,
}

function save(session: Session): Session {
  const { game, voteMode, forcedVote, stage, progress } = session
  writeStore(SESSION_STORE, { game, voteMode, forcedVote, stage, progress })
  return session
}

export const useSession = create<{
  session: Session | null
  start: (session: Session) => void
  /** Applies a game action and saves; a GameRuleError propagates to the caller. */
  apply: (action: GameAction) => void
  setStage: (stage: Stage) => void
  /** Saves the step under way (dropped by `apply` and `setStage`). */
  setProgress: (progress: Progress | null) => void
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
      set({
        session: save({ ...session, game: gameReducer(session.game, action), progress: null }),
      })
    },
    setStage: (stage) => set({ session: save({ ...current(), stage, progress: null }) }),
    setProgress: (progress) => set({ session: save({ ...current(), progress }) }),
    clear: () => {
      removeStore(SESSION_STORE.key)
      set({ session: null })
    },
  }
})
