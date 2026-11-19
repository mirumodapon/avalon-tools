import { roleDef } from '@avalon/rules'
import type { GameRecord } from './records.ts'

const DATE = new Intl.DateTimeFormat('zh-Hant-TW', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六']
const startOf = (t: Date) => new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()
const pad = (n: number) => String(n).padStart(2, '0')

export const formatDate = (ms: number) => DATE.format(ms)

/** Short day and time for the list: 「今天」「昨天」, otherwise 「11/19（四）」; plus 「08:34」. */
export function formatWhen(ms: number, now = Date.now()): { day: string; time: string } {
  const d = new Date(ms)
  const days = Math.round((startOf(new Date(now)) - startOf(d)) / 86_400_000)
  const sameYear = d.getFullYear() === new Date(now).getFullYear()
  const date = `${sameYear ? '' : `${d.getFullYear()}/`}${d.getMonth() + 1}/${d.getDate()}（${WEEKDAY[d.getDay()]}）`
  return {
    day: days === 0 ? '今天' : days === 1 ? '昨天' : date,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

/** e.g. 「梅林、刺客」, or 「只有忠臣與爪牙」. */
export function configSummary(r: GameRecord): string {
  return r.config.length ? r.config.map((id) => roleDef(id).name).join('、') : '只有忠臣與爪牙'
}
