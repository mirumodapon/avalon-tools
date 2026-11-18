import { gameReducer, type Game, type GameAction } from '@avalon/core'
import { create } from 'zustand'
import { DexieGameRepository } from '../db/dexie.ts'
import type { GameRepository, ImportItem, ImportSummary } from '../db/repository.ts'

/** Delay before an edited game is written; rapid edits coalesce into one write. */
export const SAVE_DEBOUNCE_MS = 300

let repository: GameRepository | null = null

/** Overrides the storage backend (tests). */
export function setRepository(next: GameRepository | null) {
  repository = next
}

function repo(): GameRepository {
  repository ??= new DexieGameRepository()
  return repository
}

interface GamesState {
  games: Game[]
  /** False until games are loaded from storage. */
  ready: boolean
  /** Last storage error, shown to the user. */
  storageError: string | null
  skipped: { id: string; error: string }[]
  load: () => Promise<void>
  add: (game: Game) => void
  /** Applies a rule action; throws `GameRuleError` on invalid input. */
  dispatch: (id: string, action: GameAction) => void
  replace: (game: Game) => void
  remove: (id: string) => Promise<void>
  importGames: (items: ImportItem[], makeId: () => string) => Promise<ImportSummary>
  clearAll: () => Promise<void>
  dismissError: () => void
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

function sortNewest(games: Game[]): Game[] {
  return games.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function message(e: unknown): string {
  if (e instanceof Error && e.name === 'QuotaExceededError')
    return '儲存空間不足，請匯出並刪除舊遊戲'
  return `儲存失敗：${e instanceof Error ? e.message : String(e)}`
}

export const useGames = create<GamesState>()((set, get) => {
  async function write(id: string) {
    timers.delete(id)
    const game = get().games.find((g) => g.id === id)
    if (!game) return
    try {
      await repo().put(game)
    } catch (e) {
      set({ storageError: message(e) })
    }
  }

  function schedule(id: string) {
    const t = timers.get(id)
    if (t) clearTimeout(t)
    timers.set(
      id,
      setTimeout(() => void write(id), SAVE_DEBOUNCE_MS),
    )
  }

  return {
    games: [],
    ready: false,
    storageError: null,
    skipped: [],
    load: async () => {
      try {
        const { games, skipped } = await repo().load()
        set({ games: sortNewest(games), skipped, ready: true })
      } catch (e) {
        set({
          ready: true,
          storageError: `無法讀取遊戲資料：${e instanceof Error ? e.message : String(e)}`,
        })
      }
    },
    add: (game) => {
      set({ games: sortNewest([game, ...get().games.filter((g) => g.id !== game.id)]) })
      void write(game.id)
    },
    dispatch: (id, action) => {
      const game = get().games.find((g) => g.id === id)
      if (!game) throw new Error(`找不到遊戲 ${id}`)
      const next = gameReducer(game, action)
      if (next === game) return
      set({ games: get().games.map((g) => (g.id === id ? next : g)) })
      schedule(id)
    },
    replace: (game) => {
      set({ games: get().games.map((g) => (g.id === game.id ? game : g)) })
      schedule(game.id)
    },
    remove: async (id) => {
      const t = timers.get(id)
      if (t) clearTimeout(t)
      timers.delete(id)
      set({ games: get().games.filter((g) => g.id !== id) })
      try {
        await repo().remove(id)
      } catch (e) {
        set({ storageError: message(e) })
      }
    },
    importGames: async (items, makeId) => {
      const summary = await repo().importMany(items, makeId)
      const byId = new Map(get().games.map((g) => [g.id, g]))
      for (const g of summary.games) byId.set(g.id, g)
      set({ games: sortNewest([...byId.values()]) })
      return summary
    },
    clearAll: async () => {
      for (const t of timers.values()) clearTimeout(t)
      timers.clear()
      await repo().clear()
      set({ games: [] })
    },
    dismissError: () => set({ storageError: null }),
  }
})

/** Writes pending debounced saves immediately (e.g. when the page is hidden). */
export async function flushPendingSaves(): Promise<void> {
  const ids = [...timers.keys()]
  for (const id of ids) {
    clearTimeout(timers.get(id))
    timers.delete(id)
  }
  const { games } = useGames.getState()
  await Promise.all(
    ids.map(async (id) => {
      const game = games.find((g) => g.id === id)
      if (game) await repo().put(game)
    }),
  )
}

export function useGame(id: string): Game | undefined {
  return useGames((s) => s.games.find((g) => g.id === id))
}

export function newId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  )
}
