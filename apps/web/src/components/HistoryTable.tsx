import { cellAnomaly, historyRows, type Game, type ViewMode } from '@avalon/core'
import { IconCircleCheckFilled, IconCircleXFilled } from '@tabler/icons-react'
import { Fragment } from 'react'
import { AnomalyMark, CrownMark, ForcedBadge, VoteMark } from './marks.tsx'
import { cx } from './ui.tsx'

/**
 * Paper-style record sheet: one row per proposal, one column per player.
 * The view mode only changes presentation; data is always full votes.
 */
export function HistoryTable({ game, viewMode }: { game: Game; viewMode: ViewMode }) {
  const rows = historyRows(game)
  if (rows.length === 0) {
    return <p className="py-8 text-center text-subtext0">還沒有任何派票紀錄</p>
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <caption className="sr-only">
          歷史紀錄（{viewMode === 'full' ? '派票檢視' : '派跳檢視'}）
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 bg-base px-1 text-left align-bottom text-xs font-normal text-subtext0"
            >
              局-次
            </th>
            {game.players.map((p, i) => (
              <th
                key={p.id}
                scope="col"
                aria-label={p.name}
                className="px-0.5 align-bottom font-normal"
              >
                <span className="mx-auto flex max-h-24 flex-col items-center gap-0.5">
                  <span className="truncate text-sm [writing-mode:vertical-rl]">{p.name}</span>
                  <span className="text-[10px] text-subtext0">{i + 1}</span>
                </span>
              </th>
            ))}
            <th
              scope="col"
              className="px-1 text-right align-bottom text-xs font-normal text-subtext0"
            >
              結果
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const p = row.proposal
            const newQuest = idx > 0 && rows[idx - 1]!.questIndex !== row.questIndex
            const border = newQuest ? 'border-t-2 border-surface2' : 'border-t border-surface0'
            return (
              <Fragment key={p.id}>
                <tr>
                  <th
                    scope="row"
                    className={cx(
                      'sticky left-0 z-10 bg-base px-1 py-1 text-left font-semibold whitespace-nowrap',
                      border,
                    )}
                  >
                    {row.questIndex + 1}-{row.attempt}
                    {p.forced && <ForcedBadge className="ml-1 !px-1 !py-0 [&>svg]:size-3" />}
                  </th>
                  {game.players.map((pl) => {
                    const inTeam = p.team.includes(pl.id)
                    const leader = p.leaderId === pl.id
                    const vote = p.votes[pl.id]!
                    const anomaly = cellAnomaly(p, pl.id)
                    return (
                      <td
                        key={pl.id}
                        className={cx(
                          'relative h-10 min-w-8 px-0.5 text-center',
                          border,
                          inTeam && 'bg-accent/15',
                        )}
                      >
                        <span className="sr-only">
                          {pl.name}
                          {leader && '，隊長'}
                          {inTeam && '，隊員'}
                        </span>
                        {leader && (
                          <span className="absolute top-0 left-1/2 -translate-x-1/2 leading-none">
                            <CrownMark size={12} />
                          </span>
                        )}
                        <span className="inline-flex pt-1.5">
                          {viewMode === 'full' ? (
                            <span className={vote === 'approve' ? '' : 'opacity-50'}>
                              <VoteMark vote={vote} size={16} />
                            </span>
                          ) : anomaly ? (
                            <AnomalyMark kind={anomaly} size={16} />
                          ) : (
                            <span className="text-overlay0" aria-hidden>
                              ·
                            </span>
                          )}
                        </span>
                      </td>
                    )
                  })}
                  <td className={cx('px-1 text-right whitespace-nowrap', border)}>
                    {row.quest ? (
                      <span
                        className={cx(
                          'inline-flex items-center gap-0.5 font-semibold',
                          row.quest.outcome === 'success' ? 'text-success-fg' : 'text-fail-fg',
                        )}
                      >
                        {row.quest.outcome === 'success' ? (
                          <IconCircleCheckFilled size={16} aria-hidden />
                        ) : (
                          <IconCircleXFilled size={16} aria-hidden />
                        )}
                        {row.quest.outcome === 'success' ? '成功' : '失敗'}
                        <span className="text-xs font-normal">({row.quest.failCount}敗)</span>
                      </span>
                    ) : (
                      <span className={row.approved ? 'text-success-fg' : 'text-subtext0'}>
                        {row.approvals}票{p.forced ? '・強制' : row.approved ? '・通過' : '・否決'}
                      </span>
                    )}
                  </td>
                </tr>
              </Fragment>
            )
          })}
        </tbody>
      </table>
      <Legend viewMode={viewMode} />
    </div>
  )
}

function Legend({ viewMode }: { viewMode: ViewMode }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtext0">
      <li className="flex items-center gap-1">
        <CrownMark size={14} /> 隊長
      </li>
      <li className="flex items-center gap-1">
        <span className="inline-block size-3 rounded-sm bg-accent/30" aria-hidden /> 隊員
      </li>
      {viewMode === 'full' ? (
        <>
          <li>
            <VoteMark vote="approve" showLabel size={14} />
          </li>
          <li>
            <VoteMark vote="reject" showLabel size={14} />
          </li>
        </>
      ) : (
        <>
          <li>
            <AnomalyMark kind="outside-approve" showLabel size={14} />
          </li>
          <li>
            <AnomalyMark kind="inside-reject" showLabel size={14} />
          </li>
        </>
      )}
    </ul>
  )
}
