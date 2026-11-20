import {
  gameToJson,
  gameToText,
  sanitizeFilename,
  type ExportOptions,
  type Game,
} from '@avalon/record-core'

export type ExportFormat = 'json' | 'text' | 'png' | 'link' | 'qr'

/** Formats whose content is the game's share link rather than a file. */
export type ShareFormat = Extract<ExportFormat, 'link' | 'qr'>

export function isShareFormat(format: ExportFormat): format is ShareFormat {
  return format === 'link' || format === 'qr'
}

export const FORMAT_LABEL: Record<ExportFormat, string> = {
  json: 'JSON',
  text: '純文字',
  png: 'PNG',
  link: '連結',
  qr: 'QR code',
}

export const FORMAT_HINT: Record<ExportFormat, string> = {
  json: '完整資料，可匯入還原（包含角色）',
  text: '簡短摘要，適合貼到 LINE',
  png: '歷史表格圖片，套用目前主題',
  link: '分享連結，收到的人打開後可預覽並匯入（包含角色）',
  qr: '分享連結的 QR code，用手機相機掃描即可開啟，也可下載圖片',
}

/** File name for the formats that produce a file (all but the plain link). */
export function exportFilename(name: string, format: Exclude<ExportFormat, 'link'>): string {
  const base = sanitizeFilename(name)
  switch (format) {
    case 'json':
      return `${base}.json`
    case 'text':
      return `${base}.txt`
    case 'png':
      return `${base}.png`
    case 'qr':
      return `${base}-QR.png`
  }
}

export function mimeOf(format: 'json' | 'text'): string {
  return `${format === 'json' ? 'application/json' : 'text/plain'};charset=utf-8`
}

/** Text content for the text formats. JSON ignores view/role options. */
export function exportText(game: Game, format: 'json' | 'text', opts: ExportOptions): string {
  return format === 'json' ? gameToJson(game) : gameToText(game, opts)
}
