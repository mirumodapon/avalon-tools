import {
  cellAnomaly,
  failsRequired,
  historyRows,
  ladyLied,
  ladyTruth,
  playerFaction,
  playerName,
  previousHolders,
  teamHasEvil,
  teamSize,
  validateLadyUses,
  type Game,
  type HistoryRow,
  type LadyUse,
  type ViewMode,
} from '@avalon/core'
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconPencil,
  IconX,
} from '@tabler/icons-react'
import { DeclarationMark, LadyIcon, LadyTruthMark } from '../lady/marks.tsx'
import { FactionMark, RoleIcon } from '../roles/roleIcons.tsx'
import type { DisplayOptions } from '../settings/settings.ts'
import { useSettings } from '../settings/store.ts'
import { AnomalyMark, CrownMark, VoteMark } from './marks.tsx'
import { cx } from './ui.tsx'

/** Fixed widths shared by every quest table so player columns line up across quests. */
const LABEL_W = '1.75rem'
const RESULT_W = '2rem'

function Cols({ n }: { n: number }) {
  return (
    <colgroup>
      <col style={{ width: LABEL_W }} />
      {Array.from({ length: n }, (_, i) => (
        <col key={i} />
      ))}
      <col style={{ width: RESULT_W }} />
    </colgroup>
  )
}

/**
 * Record sheet: one compact table per quest (rows = proposals, columns = players),
 * each followed by that quest's Lady of the Lake use. The view mode only changes
 * presentation; the data is always full votes.
 */
export function HistoryTable({
  game,
  viewMode,
  showRoles = false,
  onEditLady,
  display: displayOverride,
}: {
  game: Game
  viewMode: ViewMode
  /** When false, no role or faction information is rendered at all. */
  showRoles?: boolean
  /** Enables editing recorded Lady of the Lake uses. */
  onEditLady?: (index: number) => void
  /** Defaults to the global display settings. */
  display?: DisplayOptions
}) {
  const storedDisplay = useSettings((s) => s.settings.display)
  const display = displayOverride ?? storedDisplay
  const rows = historyRows(game)
  if (rows.length === 0) {
    return <p className="py-8 text-center text-subtext0">還沒有任何派票紀錄</p>
  }
  const quests = [...new Set(rows.map((r) => r.questIndex))]
  const ladyUses = game.lady?.uses ?? []
  const ladyErrors = validateLadyUses(game)

  return (
    <div className="space-y-2 text-sm">
      {quests.map((q) => (
        <div key={q} className="space-y-2">
          <QuestTable
            game={game}
            questIndex={q}
            rows={rows.filter((r) => r.questIndex === q)}
            viewMode={viewMode}
            showRoles={showRoles}
            display={display}
            heldLady={
              game.lady
                ? previousHolders(game, ladyUses.filter((u) => u.afterQuest < q).length)
                : new Set()
            }
          />
          {ladyUses.map((use, li) =>
            use.afterQuest === q ? (
              <LadyRow
                key={li}
                game={game}
                use={use}
                index={li}
                errors={ladyErrors[li] ?? []}
                showRoles={showRoles}
                detail={display.ladyResult}
                onEdit={onEditLady}
              />
            ) : null,
          )}
        </div>
      ))}

      <Legend viewMode={viewMode} showRoles={showRoles} />
    </div>
  )
}

function QuestResultBadge({
  row,
  detail,
}: {
  row: HistoryRow | undefined
  detail: DisplayOptions['questResult']
}) {
  const quest = row?.quest
  if (!quest) return <span className="text-xs text-subtext0">進行中</span>
  const success = quest.outcome === 'success'
  const Icon = success ? IconCheck : IconX
  if (detail === 'simple') {
    return (
      <span
        className={cx(
          'inline-flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-full px-2 font-bold text-on-fill',
          success ? 'bg-success' : 'bg-fail',
        )}
        title={`${success ? '成功' : '失敗'}，${quest.failCount} 張失敗`}
      >
        <Icon size={14} stroke={3} aria-hidden />
        <span className="sr-only">{success ? '成功' : '失敗'}，失敗票</span>
        {quest.failCount}
      </span>
    )
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 font-semibold',
        success ? 'text-success-fg' : 'text-fail-fg',
      )}
    >
      <Icon size={16} stroke={3} aria-hidden />
      任務{success ? '成功' : '失敗'}
      <span className="text-xs font-normal">（{quest.failCount} 張失敗）</span>
    </span>
  )
}

function QuestTable({
  game,
  questIndex,
  rows,
  viewMode,
  showRoles,
  display,
  heldLady,
}: {
  game: Game
  questIndex: number
  rows: HistoryRow[]
  viewMode: ViewMode
  showRoles: boolean
  display: DisplayOptions
  /** Players who had held the Lady before this quest. */
  heldLady: Set<string>
}) {
  const n = game.players.length
  const resultRow = rows.find((r) => r.quest)
  const outcome = resultRow?.quest?.outcome
  const tint =
    display.questResult === 'simple' && outcome
      ? outcome === 'success'
        ? 'border-success/60 bg-success/10'
        : 'border-fail/60 bg-fail/10'
      : 'border-surface1 bg-mantle'

  return (
    <table
      className={cx(
        'w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-xl border',
        tint,
      )}
    >
      <Cols n={n} />
      <caption className="sr-only">任務 {questIndex + 1}</caption>
      <thead>
        <tr>
          <th colSpan={n + 2} scope="colgroup" className="px-2 py-1.5 text-left font-normal">
            <span className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <span className="font-bold">任務 {questIndex + 1}</span>
                <span className="text-xs text-subtext0">{teamSize(n, questIndex)} 人</span>
                {failsRequired(n, questIndex) === 2 && (
                  <span className="rounded-full bg-forced px-1.5 text-[10px] font-bold text-on-fill">
                    需2敗
                  </span>
                )}
              </span>
              <QuestResultBadge row={resultRow} detail={display.questResult} />
            </span>
          </th>
        </tr>
        <tr className="text-[10px] text-subtext0">
          <th scope="col" className="border-t border-surface0 py-0.5 font-normal">
            次
          </th>
          {game.players.map((p, i) => (
            <th
              key={p.id}
              scope="col"
              aria-label={`${i + 1} 號 ${p.name}`}
              className="border-t border-surface0 px-0 py-0.5 font-semibold"
            >
              <span className="flex flex-col items-center leading-tight">
                {i + 1}
                {showRoles && game.roleAssignment[p.id] && (
                  <RoleIcon role={game.roleAssignment[p.id]!} size={12} />
                )}
                {heldLady.has(p.id) && <LadyIcon size={11} label="曾持有湖中女神" />}
              </span>
            </th>
          ))}
          <th scope="col" className="border-t border-surface0 py-0.5 font-normal">
            票
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const p = row.proposal
          const evilTeam = showRoles && teamHasEvil(game, p.team)
          return (
            <tr key={p.id}>
              <th
                scope="row"
                className={cx(
                  'border-t border-surface0 py-1 text-center text-xs font-semibold',
                  evilTeam && 'shadow-[inset_3px_0_0_var(--color-evil)]',
                )}
              >
                <span className="sr-only">
                  第 {row.attempt} 次派票{evilTeam && '，隊伍含壞人'}
                </span>
                {p.forced ? (
                  <span className="inline-flex text-forced-fg" title="強制局">
                    <IconAlertTriangle size={14} aria-hidden />
                  </span>
                ) : (
                  <span aria-hidden>{row.attempt}</span>
                )}
              </th>
              {game.players.map((pl) => {
                const inTeam = p.team.includes(pl.id)
                const leader = p.leaderId === pl.id
                const vote = p.votes[pl.id]!
                const anomaly = cellAnomaly(p, pl.id)
                const faction = showRoles ? playerFaction(game, pl.id) : null
                return (
                  <td
                    key={pl.id}
                    className={cx(
                      'relative h-9 border-t border-surface0 px-0 text-center',
                      inTeam && 'bg-accent/20',
                    )}
                  >
                    <span className="sr-only">
                      {pl.name}
                      {leader && '，隊長'}
                      {inTeam && '，隊員'}
                    </span>
                    {leader && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 leading-none">
                        <CrownMark size={11} />
                      </span>
                    )}
                    <span className="inline-flex pt-1">
                      {viewMode === 'full' ? (
                        <span className={vote === 'approve' ? '' : 'opacity-40'}>
                          <VoteMark vote={vote} size={15} />
                        </span>
                      ) : anomaly ? (
                        <span className="inline-flex flex-col items-center leading-none">
                          <AnomalyMark kind={anomaly} size={15} />
                          {faction && <FactionMark faction={faction} size={10} />}
                        </span>
                      ) : null}
                    </span>
                  </td>
                )
              })}
              <td
                className={cx(
                  'border-t border-surface0 text-center text-xs font-semibold tabular-nums',
                  row.approved ? 'text-success-fg' : 'text-subtext0',
                )}
                title={`${row.approvals} 票${p.forced ? '・強制' : row.approved ? '・通過' : '・否決'}`}
              >
                {row.approvals}
                <span className="sr-only">
                  票，{p.forced ? '強制' : row.approved ? '通過' : '否決'}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function seatOf(game: Game, id: string): number {
  return game.players.findIndex((p) => p.id === id) + 1
}

function LadyRow({
  game,
  use,
  index,
  errors,
  showRoles,
  detail,
  onEdit,
}: {
  game: Game
  use: LadyUse
  index: number
  errors: string[]
  showRoles: boolean
  detail: DisplayOptions['ladyResult']
  onEdit?: (index: number) => void
}) {
  const truth = showRoles ? ladyTruth(game, use) : null
  const lied = showRoles && ladyLied(game, use)
  return (
    <section
      aria-label={`湖中女神第 ${index + 1} 次`}
      className="flex min-h-11 items-center gap-2 rounded-xl border border-lady/60 bg-lady/15 px-2 py-1"
    >
      <LadyIcon size={18} />
      <span className="min-w-0 flex-1">
        {detail === 'simple' ? (
          <span className="flex items-center gap-1 font-semibold">
            <span title={playerName(game, use.holderId)}>{seatOf(game, use.holderId)}</span>
            <IconArrowRight size={14} aria-hidden />
            <span className="sr-only">查驗</span>
            <span title={playerName(game, use.targetId)}>{seatOf(game, use.targetId)}</span>
            <span aria-hidden>:</span>
            {use.declared === 'none' ? (
              <span className="text-subtext0">—</span>
            ) : (
              <FactionMark faction={use.declared} size={16} />
            )}
            {lied && (
              <span className="inline-flex text-lie-fg" title="說謊">
                <IconAlertTriangle size={16} aria-hidden />
                <span className="sr-only">說謊</span>
              </span>
            )}
          </span>
        ) : (
          <>
            <span className="flex flex-wrap items-center gap-x-2">
              <span>
                {playerName(game, use.holderId)} → {playerName(game, use.targetId)}：
              </span>
              <DeclarationMark declared={use.declared} />
              {truth && <LadyTruthMark truth={truth} lied={lied} />}
            </span>
            {use.note && <span className="block text-xs text-subtext0">{use.note}</span>}
          </>
        )}
      </span>
      {errors.length > 0 && (
        <span className="text-fail-fg" title={errors.join('、')}>
          <IconAlertCircle size={18} aria-hidden />
          <span className="sr-only">{errors.join('、')}</span>
        </span>
      )}
      {onEdit && (
        <button
          type="button"
          aria-label={`編輯第 ${index + 1} 次湖中女神`}
          onClick={() => onEdit(index)}
          className="inline-flex size-9 items-center justify-center rounded-lg text-subtext1 hover:bg-surface0"
        >
          <IconPencil size={16} />
        </button>
      )}
    </section>
  )
}

function Legend({ viewMode, showRoles }: { viewMode: ViewMode; showRoles: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-subtext0">
      <li className="flex items-center gap-1">
        <CrownMark size={12} /> 隊長
      </li>
      <li className="flex items-center gap-1">
        <span className="inline-block size-3 rounded-sm bg-accent/30" aria-hidden /> 隊員
      </li>
      {viewMode === 'full' ? (
        <>
          <li>
            <VoteMark vote="approve" showLabel size={12} />
          </li>
          <li>
            <VoteMark vote="reject" showLabel size={12} />
          </li>
        </>
      ) : (
        <>
          <li>
            <AnomalyMark kind="outside-approve" showLabel size={12} />
          </li>
          <li>
            <AnomalyMark kind="inside-reject" showLabel size={12} />
          </li>
        </>
      )}
      <li className="flex items-center gap-1">
        <IconAlertTriangle size={12} className="text-forced-fg" aria-hidden /> 強制局
      </li>
      {showRoles && (
        <li className="flex items-center gap-1">
          <span className="inline-block h-3 w-1 bg-evil" aria-hidden /> 隊伍含壞人
        </li>
      )}
    </ul>
  )
}
