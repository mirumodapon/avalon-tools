import { playerName } from '../game.ts'
import { failsRequired, teamSize } from '@avalon/rules'
import type { Game, PlayerId } from '../types.ts'
import {
  historyRows,
  ladyText,
  ladyUsesAfter,
  playerLabel,
  questDots,
  startedText,
  winnerText,
  type ExportOptions,
} from './common.ts'
import type { HistoryRow } from '../history.ts'

function names(game: Game, ids: readonly PlayerId[]): string {
  return ids.length ? ids.map((id) => playerName(game, id)).join('、') : '無'
}

/** Vote line for one proposal, according to the view mode. */
function voteLine(game: Game, row: HistoryRow, opts: ExportOptions): string {
  if (opts.viewMode === 'anomaly') {
    const { outsideApprove, insideReject } = row.anomalies
    if (!outsideApprove.length && !insideReject.length) return '無場外白／場內黑'
    const parts: string[] = []
    if (outsideApprove.length) parts.push(`場外白：${names(game, outsideApprove)}`)
    if (insideReject.length) parts.push(`場內黑：${names(game, insideReject)}`)
    return parts.join('｜')
  }
  const ids = game.players.map((p) => p.id)
  const approve = ids.filter((id) => row.proposal.votes[id] === 'approve')
  const reject = ids.filter((id) => row.proposal.votes[id] === 'reject')
  return `贊成 ${approve.length}：${names(game, approve)}｜反對 ${reject.length}：${names(game, reject)}`
}

/** Plain-text record of the whole game, every proposal included; for chat apps like LINE. */
export function gameToText(game: Game, opts: ExportOptions): string {
  const n = game.players.length
  const lines = [
    `【${opts.name}】`,
    `${startedText(game)}・${n}人`,
    `${questDots(game)} ${winnerText(game)}`,
    `玩家：${game.players.map((p, i) => `${i + 1}.${playerName(game, p.id)}`).join(' ')}`,
  ]
  if (opts.includeRoles && Object.keys(game.roleAssignment).length) {
    lines.push(
      `角色：${game.players
        .filter((p) => game.roleAssignment[p.id])
        .map((p) => playerLabel(game, p.id, opts))
        .join('、')}`,
    )
  }
  if (game.note) lines.push(`備註：${game.note.replace(/\n+/g, ' ')}`)

  const rows = historyRows(game)
  const quests = [...new Set(rows.map((r) => r.questIndex))]
  for (const q of quests) {
    const twoFails = failsRequired(n, q) === 2 ? '・需2張失敗' : ''
    lines.push('', `任務${q + 1}・${teamSize(n, q)}人${twoFails}`)
    for (const row of rows.filter((r) => r.questIndex === q)) {
      const p = row.proposal
      const verdict = `${p.forced ? '⚠️強制局' : ''}${row.approved ? '通過' : '否決'}`
      lines.push(
        `${row.attempt}. 👑${playerName(game, p.leaderId)}｜隊員：${names(game, p.team)}｜${verdict}`,
        `   ${voteLine(game, row, opts)}`,
      )
      if (row.quest) {
        const ok = row.quest.outcome === 'success'
        lines.push(`→ ${ok ? '✅任務成功' : '❌任務失敗'}・失敗票 ${row.quest.failCount} 張`)
      }
    }
    for (const use of ladyUsesAfter(game, q)) lines.push(`🌊${ladyText(game, use, opts)}`)
  }

  if (game.assassination?.targetId) {
    lines.push('', `🗡️刺殺：${playerLabel(game, game.assassination.targetId, opts)}`)
  }
  return `${lines.join('\n')}\n`
}
