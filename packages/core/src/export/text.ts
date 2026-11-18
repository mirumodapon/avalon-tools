import { playerName } from '../game.ts'
import { teamSize } from '../rules.ts'
import type { Game } from '../types.ts'
import {
  historyRows,
  ladyText,
  ladyUsesAfter,
  playerLabel,
  startedText,
  winnerText,
  type ExportOptions,
} from './common.ts'
import { questDots } from './markdown.ts'

/** Short plain-text summary, suitable for chat apps like LINE. */
export function gameToText(game: Game, opts: ExportOptions): string {
  const lines = [
    `【${opts.name}】`,
    `${startedText(game)}・${game.players.length}人`,
    `${questDots(game)} ${winnerText(game)}`,
  ]
  if (opts.includeRoles && Object.keys(game.roleAssignment).length) {
    lines.push(
      `角色：${game.players
        .filter((p) => game.roleAssignment[p.id])
        .map((p) => playerLabel(game, p.id, opts))
        .join('、')}`,
    )
  }
  const rows = historyRows(game)
  for (const row of rows.filter((r) => r.quest)) {
    const q = row.quest!
    const team = row.proposal.team.map((id) => playerName(game, id)).join('、')
    let line = `任務${row.questIndex + 1}（${teamSize(game.players.length, row.questIndex)}人，第${row.attempt}次）${q.outcome === 'success' ? '✅' : '❌'}${q.failCount}敗：${team}`
    if (opts.viewMode === 'anomaly') {
      const { outsideApprove, insideReject } = row.anomalies
      const parts = []
      if (outsideApprove.length)
        parts.push(`場外白 ${outsideApprove.map((id) => playerName(game, id)).join('、')}`)
      if (insideReject.length)
        parts.push(`場內黑 ${insideReject.map((id) => playerName(game, id)).join('、')}`)
      if (parts.length) line += `（${parts.join('；')}）`
    } else {
      line += `（${row.approvals}票通過）`
    }
    lines.push(line)
    for (const use of ladyUsesAfter(game, row.questIndex)) lines.push(ladyText(game, use, opts))
  }
  if (game.assassination?.targetId)
    lines.push(`刺殺：${playerLabel(game, game.assassination.targetId, opts)}`)
  if (game.note) lines.push(`備註：${game.note.replace(/\n+/g, ' ')}`)
  return `${lines.join('\n')}\n`
}
