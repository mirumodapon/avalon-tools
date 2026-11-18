import {
  gameToCsv,
  gameToJson,
  gameToMarkdown,
  gameToText,
  sanitizeFilename,
  type ExportOptions,
  type Game,
} from '@avalon/core'

export type ExportFormat = 'json' | 'csv' | 'markdown' | 'text' | 'png'

export const FORMAT_LABEL: Record<ExportFormat, string> = {
  json: 'JSON',
  csv: 'CSV',
  markdown: 'Markdown',
  text: '純文字',
  png: 'PNG',
}

export const FORMAT_HINT: Record<ExportFormat, string> = {
  json: '完整資料，可匯入還原（包含角色）',
  csv: '每次派票一列，可用試算表開啟',
  markdown: '戰報與表格，適合 Discord 或筆記',
  text: '簡短摘要，適合貼到 LINE',
  png: '歷史表格圖片，套用目前主題',
}

const EXT: Record<ExportFormat, string> = {
  json: 'json',
  csv: 'csv',
  markdown: 'md',
  text: 'txt',
  png: 'png',
}
const MIME: Record<ExportFormat, string> = {
  json: 'application/json',
  csv: 'text/csv',
  markdown: 'text/markdown',
  text: 'text/plain',
  png: 'image/png',
}

export function exportFilename(name: string, format: ExportFormat): string {
  return `${sanitizeFilename(name)}.${EXT[format]}`
}

export function mimeOf(format: ExportFormat): string {
  return `${MIME[format]}${format === 'png' ? '' : ';charset=utf-8'}`
}

/** Text content for text-based formats. JSON ignores view/role options. */
export function exportText(
  game: Game,
  format: Exclude<ExportFormat, 'png'>,
  opts: ExportOptions,
): string {
  switch (format) {
    case 'json':
      return gameToJson(game)
    case 'csv':
      return gameToCsv(game, opts)
    case 'markdown':
      return gameToMarkdown(game, opts)
    case 'text':
      return gameToText(game, opts)
  }
}
