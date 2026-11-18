import { playerName } from '../game.ts'
import type { Game } from '../types.ts'
import {
  historyRows,
  ladyText,
  ladyUsesAfter,
  playerLabel,
  voteCell,
  type ExportOptions,
} from './common.ts'

function cell(v: string | number): string {
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** One row per proposal. Starts with a BOM so Excel detects UTF-8. */
export function gameToCsv(game: Game, opts: ExportOptions): string {
  const header = [
    '任務',
    '派票次數',
    '隊長',
    '隊員',
    '強制局',
    '贊成數',
    ...game.players.map((p) => playerLabel(game, p.id, opts, false)),
    '派票結果',
    '任務結果',
    '失敗票數',
    '備註',
  ]
  const lines: (string | number)[][] = [header]
  for (const row of historyRows(game)) {
    const p = row.proposal
    lines.push([
      row.questIndex + 1,
      row.attempt,
      playerName(game, p.leaderId),
      p.team.map((id) => playerName(game, id)).join('、'),
      p.forced ? '是' : '',
      row.approvals,
      ...game.players.map((pl) => voteCell(row, pl.id, opts.viewMode, 'text')),
      p.forced ? '強制' : row.approved ? '通過' : '否決',
      row.quest ? (row.quest.outcome === 'success' ? '成功' : '失敗') : '',
      row.quest ? row.quest.failCount : '',
      '',
    ])
    if (row.quest) {
      for (const use of ladyUsesAfter(game, row.questIndex)) {
        lines.push([
          row.questIndex + 1,
          '湖中女神',
          ...Array(header.length - 3).fill(''),
          ladyText(game, use, opts),
        ])
      }
    }
  }
  if (game.note) {
    lines.push(['備註', ...Array(header.length - 2).fill(''), game.note])
  }
  return `﻿${lines.map((l) => l.map(cell).join(',')).join('\r\n')}\r\n`
}
