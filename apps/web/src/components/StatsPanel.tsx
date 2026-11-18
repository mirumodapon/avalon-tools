import {
  ladyHolderStats,
  playerName,
  playerStats,
  type Faction,
  type Game,
  type PlayerStats,
} from '@avalon/core'
import { LadyIcon } from '../lady/marks.tsx'
import { FactionMark, RoleIcon } from '../roles/roleIcons.tsx'

const pct = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}%`)

/** Post-game stats. Faction-dependent columns only appear when roles are shown. */
export function StatsPanel({ game, showRoles }: { game: Game; showRoles: boolean }) {
  const stats = playerStats(game)
  const groups: { key: Faction | 'unknown'; rows: PlayerStats[] }[] = showRoles
    ? ([
        { key: 'good', rows: stats.filter((s) => s.faction === 'good') },
        { key: 'evil', rows: stats.filter((s) => s.faction === 'evil') },
        { key: 'unknown', rows: stats.filter((s) => s.faction === null) },
      ].filter((g) => g.rows.length > 0) as { key: Faction | 'unknown'; rows: PlayerStats[] }[])
    : [{ key: 'unknown', rows: stats }]
  const lady = showRoles ? ladyHolderStats(game) : []

  return (
    <div className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-subtext0">
              <th scope="col" className="py-1 font-normal">
                玩家
              </th>
              <th scope="col" className="py-1 text-right font-normal">
                贊成率
              </th>
              {showRoles && (
                <>
                  <th scope="col" className="py-1 text-right font-normal">
                    贊成含壞人隊
                  </th>
                  <th scope="col" className="py-1 text-right font-normal">
                    當隊長組進壞人
                  </th>
                </>
              )}
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g.key}>
              {showRoles && (
                <tr>
                  <th
                    colSpan={4}
                    scope="colgroup"
                    className="pt-3 pb-1 text-left text-xs font-semibold"
                  >
                    {g.key === 'unknown' ? (
                      <span className="text-subtext0">未知陣營</span>
                    ) : (
                      <FactionMark faction={g.key} showLabel />
                    )}
                  </th>
                </tr>
              )}
              {g.rows.map((s) => (
                <tr key={s.playerId} className="border-t border-surface0">
                  <th scope="row" className="py-1.5 text-left font-normal">
                    <span className="flex items-center gap-1">
                      {playerName(game, s.playerId)}
                      {showRoles && game.roleAssignment[s.playerId] && (
                        <RoleIcon role={game.roleAssignment[s.playerId]!} size={14} />
                      )}
                    </span>
                  </th>
                  <td className="py-1.5 text-right tabular-nums">
                    {pct(s.approveRate)}
                    <span className="ml-1 text-xs text-subtext0">
                      ({s.approvals}/{s.votes})
                    </span>
                  </td>
                  {showRoles && (
                    <>
                      <td className="py-1.5 text-right tabular-nums">{s.approvalsForEvilTeams}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {s.ledTeamsWithEvil}/{s.timesLeader}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <p className="text-xs text-subtext0">
        贊成率不計強制局。{!showRoles && '開啟「顯示角色」可看到陣營相關統計。'}
      </p>
      {lady.length > 0 && (
        <div>
          <h3 className="mb-1 flex items-center gap-1 text-sm font-semibold">
            <LadyIcon size={16} />
            湖中女神宣告
          </h3>
          <ul className="text-sm">
            {lady.map((l) => (
              <li key={l.playerId} className="flex justify-between border-t border-surface0 py-1.5">
                <span>{playerName(game, l.playerId)}</span>
                <span className="text-subtext1">
                  誠實 {l.honest}・
                  <span className={l.lied ? 'font-semibold text-lie-fg' : ''}>說謊 {l.lied}</span>
                  {l.unknown > 0 && `・無法判斷 ${l.unknown}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
