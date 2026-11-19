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

export const formatDate = (ms: number) => DATE.format(ms)

/** e.g. 「梅林、刺客」, or 「只有忠臣與爪牙」. */
export function configSummary(r: GameRecord): string {
  return r.config.length ? r.config.map((id) => roleDef(id).name).join('、') : '只有忠臣與爪牙'
}
