import {
  convertFlags,
  votesFromFlags,
  type Game,
  type InputMode,
  type PlayerId,
  type Votes,
} from '@avalon/record-core'
import { VOTE_MARK } from '@avalon/pass-play'
import { BottomBar, Button, ConfirmSheet, cx, Segmented } from '@avalon/ui'
import { IconFlag } from '@tabler/icons-react'
import { useState } from 'react'
import { seatLabel } from '../seat.ts'
import { useSetup } from '../setup/settings.ts'

/** The record app's two ways of entering votes. */
const INPUT_MODES = [
  { value: 'approvals', label: '派票（記贊成）' },
  { value: 'anomalies', label: '派跳（記異常）' },
] as const satisfies readonly { value: InputMode; label: string }[]

const HINT: Record<InputMode, string> = {
  approvals: '點選投同意的玩家，其餘視為反對。',
  anomalies: '預設隊員同意、其他人反對；只點選和預設不同的玩家（場外白／場內黑）。',
}

/**
 * 隊長輸入: everyone votes in the open and the leader enters it, either by marking who
 * approved (派票) or only the exceptions to "team approves, the rest reject" (派跳).
 * Switching keeps the votes; the way last used is remembered.
 */
export function LeaderVote({
  game,
  team,
  onDone,
}: {
  game: Game
  team: readonly PlayerId[]
  onDone: (votes: Votes, inputMode: InputMode) => void
}) {
  const mode = useSetup((s) => s.settings.leaderInputMode)
  const update = useSetup((s) => s.update)
  const [flags, setFlags] = useState<PlayerId[]>([])
  const [confirming, setConfirming] = useState(false)
  const ids = game.players.map((p) => p.id)
  const votes = votesFromFlags(mode, ids, team, flags)
  const approvers = ids.filter((id) => votes[id] === 'approve')

  function switchMode(next: InputMode) {
    // Nothing marked yet: start from the new way's own default rather than converting
    // "everyone rejects" (派票 with no marks) into exceptions.
    setFlags(flags.length ? convertFlags(mode, next, ids, team, flags) : [])
    update({ leaderInputMode: next })
  }
  const toggle = (id: PlayerId) =>
    setFlags(flags.includes(id) ? flags.filter((x) => x !== id) : [...flags, id])

  return (
    <>
      <Segmented label="輸入方式" value={mode} options={INPUT_MODES} onChange={switchMode} />
      <p className="text-sm text-subtext1">{HINT[mode]}</p>
      <ul className="grid grid-cols-2 gap-2">
        {game.players.map((p) => {
          const inTeam = team.includes(p.id)
          const vote = votes[p.id]!
          const anomaly = mode === 'anomalies' && (inTeam ? vote === 'reject' : vote === 'approve')
          const { label, icon: Icon, text } = VOTE_MARK[vote]
          return (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={flags.includes(p.id)}
                onClick={() => toggle(p.id)}
                className={cx(
                  // A fixed height: every seat button is the same size, team member or not.
                  'flex h-14 w-full items-center justify-between gap-2 rounded-xl border-2 px-3 text-left',
                  // One colour set only: the anomaly colours replace the vote's.
                  anomaly
                    ? inTeam
                      ? 'border-inside-reject bg-inside-reject/15'
                      : 'border-outside-approve bg-outside-approve/15'
                    : vote === 'approve'
                      ? 'border-approve bg-approve/15'
                      : 'border-transparent bg-surface0',
                )}
              >
                <span className="flex min-w-0 items-center gap-1">
                  <span className="truncate font-bold">{seatLabel(game, p.id)}</span>
                  {inTeam && (
                    <span className="inline-flex shrink-0 text-accent-fg" title="隊員">
                      <IconFlag size={16} aria-hidden />
                      <span className="sr-only">隊員</span>
                    </span>
                  )}
                </span>
                {anomaly ? (
                  <span
                    className={cx(
                      'shrink-0 text-sm font-bold',
                      inTeam ? 'text-inside-reject-fg' : 'text-outside-approve-fg',
                    )}
                  >
                    {inTeam ? '場內黑' : '場外白'}
                  </span>
                ) : (
                  <span
                    className={cx(
                      'inline-flex shrink-0 items-center gap-1 text-sm font-bold',
                      text,
                    )}
                  >
                    <Icon size={16} aria-hidden />
                    {label}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
      <BottomBar>
        <Button variant="primary" className="w-full" onClick={() => setConfirming(true)}>
          送出投票
        </Button>
      </BottomBar>
      <ConfirmSheet
        open={confirming}
        title="送出投票？"
        message={
          approvers.length
            ? `同意：${approvers.map((id) => seatLabel(game, id)).join('、')}`
            : '所有人都投反對。'
        }
        confirmLabel="確定"
        onConfirm={() => {
          setConfirming(false)
          onDone(votes, mode)
        }}
        onClose={() => setConfirming(false)}
      />
    </>
  )
}
