import { deriveState, playerName } from '../game.ts'
import { cellAnomaly, historyRows, type HistoryRow } from '../history.ts'
import { LADY_DECLARATION_LABEL, ladyLied, ladyTruth } from '../lady.ts'
import { dateKey, formatTime, WINNER_LABEL } from '../naming.ts'
import { FACTION_LABEL, roleDef } from '@avalon/rules'
import type { Game, LadyUse, PlayerId, RoleId, ViewMode } from '../types.ts'

export interface ExportOptions {
  /** Display name (custom or rendered from the naming template). */
  name: string
  viewMode: ViewMode
  /** When false, no role or faction information is written. */
  includeRoles: boolean
}

export const ROLE_EMOJI: Record<RoleId, string> = {
  merlin: '🧙',
  percival: '👁️',
  loyal: '🛡️',
  morgana: '🎭',
  assassin: '🗡️',
  mordred: '🕶️',
  oberon: '👻',
  minion: '💀',
}

export const FACTION_EMOJI = { good: '🔵', evil: '🔴' } as const

export function roleText(game: Game, id: PlayerId, opts: ExportOptions, emoji = true): string {
  if (!opts.includeRoles) return ''
  const role = game.roleAssignment[id]
  if (!role) return ''
  return emoji ? `${ROLE_EMOJI[role]}${roleDef(role).name}` : roleDef(role).name
}

export function playerLabel(game: Game, id: PlayerId, opts: ExportOptions, emoji = true): string {
  const role = roleText(game, id, opts, emoji)
  return role ? `${playerName(game, id)}(${role})` : playerName(game, id)
}

/** Cell text for one player's vote in a proposal, according to the view mode. */
export function voteCell(
  row: HistoryRow,
  id: PlayerId,
  viewMode: ViewMode,
  style: 'text' | 'emoji',
): string {
  if (viewMode === 'full') {
    const approve = row.proposal.votes[id] === 'approve'
    return style === 'emoji' ? (approve ? '✅' : '❌') : approve ? '贊成' : '反對'
  }
  const a = cellAnomaly(row.proposal, id)
  if (!a) return ''
  if (style === 'emoji') return a === 'outside-approve' ? '👍場外白' : '👎場內黑'
  return a === 'outside-approve' ? '場外白' : '場內黑'
}

export function resultText(row: HistoryRow): string {
  if (row.quest) {
    return `任務${row.quest.outcome === 'success' ? '成功' : '失敗'}（${row.quest.failCount} 張失敗）`
  }
  return row.approved ? '通過' : '否決'
}

export function ladyText(game: Game, use: LadyUse, opts: ExportOptions): string {
  const holder = playerName(game, use.holderId)
  const target = playerName(game, use.targetId)
  let text = `湖中女神：${holder} → ${target}：${LADY_DECLARATION_LABEL[use.declared]}`
  if (opts.includeRoles) {
    const truth = ladyTruth(game, use)
    if (truth) text += `（實際${FACTION_LABEL[truth]}${ladyLied(game, use) ? '，說謊' : ''}）`
  }
  if (use.note) text += `｜${use.note}`
  return text
}

export function ladyUsesAfter(game: Game, questIndex: number): LadyUse[] {
  return (game.lady?.uses ?? []).filter((u) => u.afterQuest === questIndex)
}

export function winnerText(game: Game): string {
  const s = deriveState(game)
  if (!s.winner) return '未結束'
  const reason =
    s.winReason === 'quests-failed'
      ? '3 個任務失敗'
      : s.winReason === 'forced-rejected'
        ? '強制局未通過'
        : s.winReason === 'assassination-hit'
          ? '刺客刺中梅林'
          : '刺客沒有刺中梅林'
  return `${WINNER_LABEL[s.winner]}勝利（${reason}）`
}

export function startedText(game: Game): string {
  const d = new Date(game.createdAt)
  return `${dateKey(d)} ${formatTime(d)}`
}

export { historyRows }
