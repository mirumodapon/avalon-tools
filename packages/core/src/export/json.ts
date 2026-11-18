import { parseGame } from '../schema.ts'
import type { Game } from '../types.ts'

/** Full-fidelity JSON for one game (always includes roles; independent of view mode). */
export function gameToJson(game: Game): string {
  return `${JSON.stringify(game, null, 2)}\n`
}

/** All games as a JSON array. */
export function gamesToJson(games: readonly Game[]): string {
  return `${JSON.stringify(games, null, 2)}\n`
}

export interface ImportParseResult {
  games: Game[]
  /** Per-item errors (index in the file, message). */
  errors: { index: number; error: string }[]
}

/** Parses a JSON export: a single game object or an array of games. */
export function parseGamesJson(text: string): ImportParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    return {
      games: [],
      errors: [
        { index: -1, error: `不是有效的 JSON：${e instanceof Error ? e.message : String(e)}` },
      ],
    }
  }
  const items = Array.isArray(raw) ? raw : [raw]
  if (items.length === 0) return { games: [], errors: [{ index: -1, error: '檔案中沒有任何遊戲' }] }
  const games: Game[] = []
  const errors: ImportParseResult['errors'] = []
  items.forEach((item, index) => {
    const r = parseGame(item)
    if (r.ok) games.push(r.game)
    else errors.push({ index, error: r.error })
  })
  return { games, errors }
}
