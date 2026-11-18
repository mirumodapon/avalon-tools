import { deriveState, playerName } from '../game.ts'
import { QUEST_COUNT } from '../rules.ts'
import type { Game } from '../types.ts'
import {
  historyRows,
  ladyText,
  ladyUsesAfter,
  playerLabel,
  resultText,
  startedText,
  voteCell,
  winnerText,
  type ExportOptions,
} from './common.ts'

const esc = (s: string) => s.replace(/\|/g, '\\|')

export function questDots(game: Game): string {
  const s = deriveState(game)
  return Array.from({ length: QUEST_COUNT }, (_, i) =>
    s.outcomes[i] === 'success' ? '✅' : s.outcomes[i] === 'fail' ? '❌' : '⚪',
  ).join('')
}

/** Readable battle report with a vote table, e.g. for Discord or notes. */
export function gameToMarkdown(game: Game, opts: ExportOptions): string {
  const out: string[] = [`# ${opts.name}`, '']
  if (game.note) {
    out.push(...game.note.split('\n').map((l) => `> ${l}`), '')
  }
  out.push(
    `- 開始：${startedText(game)}`,
    `- 人數：${game.players.length} 人`,
    `- 結果：${winnerText(game)}`,
    `- 任務：${questDots(game)}`,
  )
  if (game.assassination?.targetId) {
    out.push(`- 刺殺目標：${playerLabel(game, game.assassination.targetId, opts)}`)
  }
  out.push(
    `- 玩家：${game.players.map((p, i) => `${i + 1}.${playerLabel(game, p.id, opts)}`).join('、')}`,
  )
  out.push('', `## 紀錄（${opts.viewMode === 'full' ? '派票檢視' : '派跳檢視'}）`, '')

  const players = game.players.map((p) => esc(playerName(game, p.id)))
  out.push(`| 局-次 | 隊長 | 隊員 | ${players.join(' | ')} | 結果 |`)
  out.push(`|---|---|---|${players.map(() => ':-:').join('|')}|---|`)
  for (const row of historyRows(game)) {
    const p = row.proposal
    const label = `${row.questIndex + 1}-${row.attempt}${p.forced ? '⚠️' : ''}`
    const team = p.team.map((id) => esc(playerName(game, id))).join('、')
    const votes = game.players.map((pl) => voteCell(row, pl.id, opts.viewMode, 'emoji'))
    out.push(
      `| ${label} | 👑${esc(playerName(game, p.leaderId))} | ${team} | ${votes.join(' | ')} | ${resultText(row)} |`,
    )
    if (row.quest) {
      for (const use of ladyUsesAfter(game, row.questIndex)) {
        out.push(
          `| 🌊 | ${esc(ladyText(game, use, opts))} | | ${players.map(() => '').join(' | ')} | |`,
        )
      }
    }
  }
  out.push('')
  if (opts.viewMode === 'anomaly') out.push('👍場外白：隊伍外卻贊成；👎場內黑：隊伍內卻反對', '')
  return out.join('\n')
}
