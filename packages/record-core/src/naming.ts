/**
 * Game naming templates.
 *
 * Placeholders:
 * - `{date}`        game date, formatted with the template's `dateFormat` (default `YYYY-MM-DD`)
 * - `{date:FORMAT}` game date with an inline format (tokens: YYYY, YY, MM, M, DD, D)
 * - `{seq}`         N-th game of that day, fixed when the game is created
 * - `{time}`        start time `HH:mm`
 * - `{players}`     player count
 * - `{winner}`      好人 / 壞人, empty while the game is unfinished
 */
import type { Faction, Game } from './types.ts'

export interface NamingTemplate {
  template: string
  dateFormat: string
}

export const DEFAULT_NAMING: NamingTemplate = {
  template: '{date} 第{seq}場',
  dateFormat: 'YYYY-MM-DD',
}

export const DATE_FORMATS = ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYYMMDD', 'MM/DD', 'M月D日'] as const

export const PLACEHOLDERS = [
  { token: '{date}', description: '遊戲日期' },
  { token: '{seq}', description: '當天第幾場' },
  { token: '{time}', description: '開始時間 HH:mm' },
  { token: '{players}', description: '人數' },
  { token: '{winner}', description: '勝方（好人／壞人）' },
] as const

export interface NamingContext {
  /** Game start time. Formatted in the runtime's local time zone. */
  startedAt: Date
  seq: number
  players: number
  winner: Faction | null
}

const pad = (n: number) => String(n).padStart(2, '0')

export function formatDate(date: Date, format: string): string {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return format.replace(/YYYY|YY|MM|M|DD|D/g, (t) => {
    switch (t) {
      case 'YYYY':
        return String(y)
      case 'YY':
        return String(y).slice(-2)
      case 'MM':
        return pad(m)
      case 'M':
        return String(m)
      case 'DD':
        return pad(d)
      default:
        return String(d)
    }
  })
}

/** Local calendar date key `YYYY-MM-DD`, used for `{seq}` and indexing. */
export function dateKey(date: Date): string {
  return formatDate(date, 'YYYY-MM-DD')
}

export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const WINNER_LABEL: Record<Faction, string> = { good: '好人', evil: '壞人' }

/** Renders a template. Unknown placeholders are left as-is; the result is trimmed and whitespace-collapsed. */
export function renderName(naming: NamingTemplate, ctx: NamingContext): string {
  const out = naming.template.replace(
    /\{(\w+)(?::([^}]*))?\}/g,
    (whole, key: string, arg?: string) => {
      switch (key) {
        case 'date':
          return formatDate(ctx.startedAt, arg || naming.dateFormat || DEFAULT_NAMING.dateFormat)
        case 'seq':
          return String(ctx.seq)
        case 'time':
          return formatTime(ctx.startedAt)
        case 'players':
          return String(ctx.players)
        case 'winner':
          return ctx.winner ? WINNER_LABEL[ctx.winner] : ''
        default:
          return whole
      }
    },
  )
  return out.replace(/\s+/g, ' ').trim()
}

/** `{seq}` for a new game: one more than the highest seq among games of the same local day. */
export function nextSeq(
  games: readonly Pick<Game, 'createdAt' | 'name'>[],
  startedAt: Date,
): number {
  const key = dateKey(startedAt)
  let max = 0
  for (const g of games) {
    if (dateKey(new Date(g.createdAt)) === key) max = Math.max(max, g.name.seq)
  }
  return max + 1
}

/** The name to show: the user's custom name, else the template applied live. */
export function displayName(
  game: Pick<Game, 'name' | 'createdAt' | 'players'>,
  naming: NamingTemplate,
  winner: Faction | null,
): string {
  if (game.name.custom) return game.name.custom
  const rendered = renderName(naming, {
    startedAt: new Date(game.createdAt),
    seq: game.name.seq,
    players: game.players.length,
    winner,
  })
  return rendered || game.name.auto || `第${game.name.seq}場`
}

/** Makes a string safe as a file name across platforms. */
export function sanitizeFilename(name: string, fallback = 'avalon'): string {
  const cleaned = name
    // oxlint-disable-next-line no-control-regex -- strip control characters
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 120)
  return cleaned || fallback
}
