import { gameReducer, type Game, type GameAction } from '@avalon/core'
import { create } from 'zustand'

interface GamesState {
  games: Game[]
  add: (game: Game) => void
  /** Applies a rule action; throws `GameRuleError` on invalid input. */
  dispatch: (id: string, action: GameAction) => void
  replace: (game: Game) => void
  remove: (id: string) => void
}

export const useGames = create<GamesState>()((set, get) => ({
  games: [],
  add: (game) => set({ games: [game, ...get().games.filter((g) => g.id !== game.id)] }),
  dispatch: (id, action) => {
    const game = get().games.find((g) => g.id === id)
    if (!game) throw new Error(`找不到遊戲 ${id}`)
    const next = gameReducer(game, action)
    if (next !== game) set({ games: get().games.map((g) => (g.id === id ? next : g)) })
  },
  replace: (game) => set({ games: get().games.map((g) => (g.id === game.id ? game : g)) }),
  remove: (id) => set({ games: get().games.filter((g) => g.id !== id) }),
}))

export function useGame(id: string): Game | undefined {
  return useGames((s) => s.games.find((g) => g.id === id))
}

export function newId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  )
}
