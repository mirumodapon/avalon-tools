import { resultText } from '@avalon/pass-play'
import {
  deriveState,
  gameReducer,
  LADY_DECLARATION_LABEL,
  recordShareUrl,
  WINNER_LABEL,
  type Game,
  type WinReason,
} from '@avalon/record-core'
import { docsHref, toolById } from '@avalon/registry'
import type { RoleId } from '@avalon/rules'
import {
  AppShell,
  BottomBar,
  Button,
  Card,
  ConfirmSheet,
  cx,
  RoleIcon,
  SectionTitle,
} from '@avalon/ui'
import { IconClipboardPlus } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { seatLabel } from '../seat.ts'
import { useSession } from '../session/store.ts'
import type { Session } from '../session/types.ts'

const REASON: Record<WinReason, string> = {
  'quests-failed': '三次任務失敗',
  'forced-rejected': '強制局被否決',
  'assassination-hit': '刺中梅林',
  'assassination-missed': '沒刺中梅林',
}

/** Each quest: who led the team that went, how many teams were turned down, the result. */
function RoundSummary({ game }: { game: Game }) {
  return (
    <ol className="space-y-3">
      {game.rounds.map((round, i) => {
        const last = round.proposals.at(-1)
        const rejected = round.proposals.length - (round.result ? 1 : 0)
        const lady = game.lady?.uses.find((u) => u.afterQuest === i)
        return (
          // Quests are fixed positions; the index is the identity.
          <li key={i} className="space-y-1">
            <p className="font-bold">
              第 {i + 1} 次任務：
              <span className={round.result?.failCount ? 'text-fail-fg' : 'text-success-fg'}>
                {round.result ? resultText(round.result.failCount) : '未出任務'}
              </span>
            </p>
            {last && round.result && (
              <p className="text-sm text-subtext1">
                隊長 {seatLabel(game, last.leaderId)}；隊員{' '}
                {last.team.map((id) => seatLabel(game, id)).join('、')}
              </p>
            )}
            {rejected > 0 && <p className="text-sm text-subtext1">否決 {rejected} 次</p>}
            {lady && (
              <p className="text-sm text-subtext1">
                湖中女神：{seatLabel(game, lady.holderId)} 查驗 {seatLabel(game, lady.targetId)}，
                {LADY_DECLARATION_LABEL[lady.declared]}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/**
 * 結算: who won and why, everyone's role, each quest, and the hand-off to the record app
 * (a share link opened in a new tab). The game stays here until 新遊戲.
 */
export function FinishPage({ session }: { session: Session }) {
  const { game } = session
  const clear = useSession((s) => s.clear)
  const { winner, winReason } = deriveState(game)
  const [href, setHref] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    let live = true
    const saved = gameReducer(game, { type: 'markSaved' })
    void recordShareUrl(saved, window.location.origin, toolById('record').path).then((url) => {
      if (live) setHref(url)
    })
    return () => {
      live = false
    }
  }, [game])

  return (
    <AppShell title="結算" homeHref={null} helpHref={docsHref('guide/assistant/')}>
      <div className="flex-1 space-y-4 pt-2 pb-24">
        <Card className="text-center">
          <p
            className={cx(
              'text-3xl font-bold',
              winner === 'evil' ? 'text-evil-fg' : 'text-good-fg',
            )}
          >
            {winner ? `${WINNER_LABEL[winner]}獲勝` : '遊戲結束'}
          </p>
          {winReason && <p className="mt-1 text-subtext1">{REASON[winReason]}</p>}
        </Card>
        <Card>
          <SectionTitle>角色</SectionTitle>
          <ul className="divide-y divide-surface0">
            {game.players.map((p) => {
              const role = game.roleAssignment[p.id] as RoleId | undefined
              return (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span>{seatLabel(game, p.id)}</span>
                  {role && <RoleIcon role={role} size={18} showName />}
                </li>
              )
            })}
          </ul>
        </Card>
        <Card>
          <SectionTitle>每輪摘要</SectionTitle>
          <RoundSummary game={game} />
        </Card>
      </div>
      <BottomBar>
        <div className="flex flex-col gap-2">
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent font-bold text-on-accent"
            >
              <IconClipboardPlus size={20} aria-hidden />
              加入遊戲紀錄
            </a>
          )}
          <Button onClick={() => setConfirming(true)}>新遊戲</Button>
        </div>
      </BottomBar>
      <ConfirmSheet
        open={confirming}
        title="開始新遊戲？"
        message="這一場不會保存在這裡；還沒加入遊戲紀錄的話，請先按「加入遊戲紀錄」。"
        confirmLabel="開始新遊戲"
        onConfirm={clear}
        onClose={() => setConfirming(false)}
      />
    </AppShell>
  )
}
