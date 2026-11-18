import {
  deriveState,
  MAX_PROPOSALS,
  playerName,
  QUEST_COUNT,
  teamSizes,
  failsRequired,
  isLadyQuest,
  type Game,
} from '@avalon/core'
import { IconAlertTriangle, IconCheck, IconRipple, IconRippleOff, IconX } from '@tabler/icons-react'
import { Fragment } from 'react'
import { LadyIcon } from '../lady/marks.tsx'
import { CrownMark } from './marks.tsx'
import { cx } from './ui.tsx'

/** Always-visible game progress: quests, current proposal, leader and vote track. */
export function ProgressOverview({ game }: { game: Game }) {
  const s = deriveState(game)
  const n = game.players.length
  const sizes = teamSizes(n)
  const inProgress = s.phase === 'proposal' || s.phase === 'quest'
  const proposalsThisQuest = game.rounds[s.questIndex]?.proposals.length ?? 0
  // In phase `proposal`, `attempt` is the one being recorded; in `quest`, the approved one.
  const track = s.phase === 'proposal' ? s.attempt : proposalsThisQuest

  return (
    <div className="space-y-2 px-4 pb-3">
      <ol className="flex items-center justify-between gap-1" aria-label="任務進度">
        {Array.from({ length: QUEST_COUNT }, (_, q) => {
          const outcome = s.outcomes[q]
          const current = inProgress && q === s.questIndex
          const twoFails = failsRequired(n, q) === 2
          const label = `任務 ${q + 1}：${outcome === 'success' ? '成功' : outcome === 'fail' ? '失敗' : current ? '進行中' : '未進行'}，${sizes[q]} 人${twoFails ? '，需 2 張失敗' : ''}`
          const ladyUse = game.lady?.uses.find((u) => u.afterQuest === q)
          const ladySlot = game.lady && isLadyQuest(q)
          return (
            <Fragment key={q}>
              <li className="relative" aria-label={label} title={label}>
                <span
                  className={cx(
                    'flex size-11 items-center justify-center rounded-full border-2 text-base font-bold',
                    outcome === 'success' && 'border-success bg-success text-base',
                    outcome === 'fail' && 'border-fail bg-fail text-base',
                    !outcome &&
                      (current ? 'border-accent text-accent-fg' : 'border-surface2 text-subtext0'),
                  )}
                  aria-hidden
                >
                  {outcome === 'success' ? (
                    <IconCheck size={22} stroke={3} />
                  ) : outcome === 'fail' ? (
                    <IconX size={22} stroke={3} />
                  ) : (
                    sizes[q]
                  )}
                </span>
                {twoFails && (
                  <span
                    aria-hidden
                    className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-base bg-forced px-1 text-[10px] font-bold text-base"
                  >
                    ×2
                  </span>
                )}
              </li>
              {ladySlot && (
                <li
                  className={cx(
                    'flex',
                    ladyUse && !ladyUse.skipped ? 'text-lady-fg' : 'text-overlay0',
                  )}
                  aria-label={`任務 ${q + 1} 後湖中女神：${ladyUse ? (ladyUse.skipped ? '已跳過' : '已使用') : '未使用'}`}
                  title={`任務 ${q + 1} 後使用湖中女神`}
                >
                  {ladyUse?.skipped ? (
                    <IconRippleOff size={14} aria-hidden />
                  ) : (
                    <IconRipple size={14} aria-hidden stroke={ladyUse ? 2.5 : 1.5} />
                  )}
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
      {s.ladyHolderId && (
        <p className="flex items-center gap-1 text-sm text-subtext1">
          <LadyIcon size={16} />
          湖中女神持有者：<span className="font-semibold">{playerName(game, s.ladyHolderId)}</span>
        </p>
      )}

      {inProgress && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex min-w-0 items-center gap-1">
            <span className="shrink-0 font-semibold">
              任務 {s.questIndex + 1}・第 {s.attempt} 次派票
            </span>
            <span className="flex min-w-0 items-center gap-0.5 text-subtext1">
              <CrownMark size={16} />
              <span className="truncate">{playerName(game, s.leaderId)}</span>
            </span>
          </span>
          <ol
            className="flex shrink-0 items-center gap-1"
            aria-label={`派票次數 ${track} / ${MAX_PROPOSALS}`}
          >
            {Array.from({ length: MAX_PROPOSALS }, (_, i) => {
              const k = i + 1
              const forced = k === MAX_PROPOSALS
              const done = k < track || (k === track && s.phase === 'quest')
              const now = k === track
              return (
                <li
                  key={k}
                  aria-hidden
                  className={cx(
                    'flex size-6 items-center justify-center rounded-full text-xs font-bold',
                    forced ? 'border-2 border-forced' : 'border border-surface2',
                    done && (forced ? 'bg-forced text-base' : 'bg-overlay0 text-base'),
                    now && !done && (forced ? 'bg-forced text-base' : 'bg-accent text-on-accent'),
                    !done && !now && (forced ? 'text-forced-fg' : 'text-subtext0'),
                  )}
                >
                  {forced ? <IconAlertTriangle size={14} /> : k}
                </li>
              )
            })}
          </ol>
        </div>
      )}
      {inProgress && s.forced && s.phase === 'proposal' && (
        <p className="flex items-center gap-1 rounded-lg bg-forced/15 px-2 py-1 text-sm font-semibold text-forced-fg">
          <IconAlertTriangle size={16} aria-hidden />
          強制局：這次派票的隊伍將直接出任務
        </p>
      )}
    </div>
  )
}
