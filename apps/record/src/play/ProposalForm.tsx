import {
  countApprovals,
  isMajority,
  nextSeat,
  playerIds,
  type Game,
  type GameState,
  type InputMode,
  type PlayerId,
  type Votes,
} from '@avalon/record-core'
import { IconArrowLeft, IconArrowRight, IconSend } from '@tabler/icons-react'
import { useState, type ReactNode } from 'react'
import { AnomalyMark, CrownMark, ForcedBadge, TeamMark, VoteMark } from '../components/marks.tsx'
import { BottomBar, Button, Card, cx, Segmented } from '../components/ui.tsx'
import { Sheet } from '../components/Sheet.tsx'
import { useSettings } from '../settings/store.ts'
import { usePersistentState } from '../session/usePersistentState.ts'
import {
  draftVotes,
  emptyDraft,
  forcedApproveVotes,
  initialInputMode,
  setAll,
  switchMode,
  toggleFlag,
  toggleTeam,
} from './draft.ts'

export const INPUT_MODE_OPTIONS: { value: InputMode; label: string }[] = [
  { value: 'approvals', label: '派票（記贊成）' },
  { value: 'anomalies', label: '派跳（記異常）' },
]

type Step = 'team' | 'vote'

export interface ProposalInput {
  team: PlayerId[]
  votes: Votes
  inputMode: InputMode
  leaderId: PlayerId
}

export function ProposalForm({
  game,
  state,
  onSubmit,
}: {
  game: Game
  state: GameState
  onSubmit: (input: ProposalInput) => void
}) {
  const settings = useSettings((s) => s.settings)
  const ids = playerIds(game)
  // The half-entered proposal survives closing the app; tied to this game and attempt.
  const draftKey = `${game.id}:q${state.questIndex}:a${state.attempt}`
  const [draft, setDraft] = usePersistentState('proposal-draft', draftKey, () =>
    emptyDraft(initialInputMode(game, settings.defaultInputMode)),
  )
  const [step, setStep] = usePersistentState<Step>('proposal-step', draftKey, 'team')
  const [leaderId, setLeaderId] = usePersistentState('proposal-leader', draftKey, state.leaderId)
  const [pickingLeader, setPickingLeader] = useState(false)

  const autoApprove = state.forced && settings.forcedAutoApprove
  const teamFull = draft.team.length === state.teamSize
  const votes = autoApprove ? forcedApproveVotes(ids) : draftVotes(draft, ids)
  const approvals = countApprovals(votes)
  const passes = isMajority(approvals, ids.length)

  function submit() {
    onSubmit({ team: draft.team, votes, inputMode: draft.mode, leaderId })
  }

  const leaderName = game.players.find((p) => p.id === leaderId)?.name

  return (
    <div className="flex flex-1 flex-col">
      {step === 'team' ? (
        <section aria-label="選擇隊員">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-subtext0">
              選擇隊員
              <span className={teamFull ? 'text-success-fg' : ''}>
                {draft.team.length}/{state.teamSize}
              </span>
            </h2>
            {state.forced && <ForcedBadge />}
            <span className="flex-1" />
            <Button
              variant="ghost"
              className="min-h-9 max-w-[45%] px-2 text-sm"
              aria-label={`隊長：${leaderName}，更換隊長`}
              onClick={() => setPickingLeader(true)}
            >
              <CrownMark size={16} />
              <span className="truncate">{leaderName}</span>
              <span className="shrink-0 text-subtext0">更換</span>
            </Button>
          </div>
          <SeatGrid>
            {game.players.map((p, i) => {
              const inTeam = draft.team.includes(p.id)
              const disabled = !inTeam && teamFull
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={inTeam}
                  disabled={disabled}
                  onClick={() => setDraft((d) => toggleTeam(d, p.id))}
                  className={cx(
                    'flex min-h-12 items-center gap-2 rounded-xl border-2 px-2.5 text-left transition-colors',
                    inTeam ? 'border-accent bg-accent/15' : 'border-transparent bg-surface0',
                    disabled && 'opacity-40',
                  )}
                >
                  <SeatNo n={i + 1} />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  {p.id === leaderId && <CrownMark />}
                  {inTeam && <TeamMark size={18} />}
                </button>
              )
            })}
          </SeatGrid>
        </section>
      ) : (
        <section aria-label="記錄投票">
          <h2 className="sr-only">記錄投票</h2>
          {state.forced && <ForcedBadge className="mb-2" />}
          {autoApprove ? (
            <Card className="text-sm text-subtext1">
              強制局：已自動記為全員贊成，隊伍出任務。可在設定中關閉此行為，改為逐一記錄。
            </Card>
          ) : (
            <>
              <Segmented
                label="輸入方式"
                value={draft.mode}
                options={INPUT_MODE_OPTIONS}
                onChange={(m) => setDraft((d) => switchMode(d, m, ids))}
                className="mb-2"
              />
              <p className="sr-only">
                {draft.mode === 'approvals'
                  ? '點選投贊成票的玩家，其餘視為反對。'
                  : '預設隊內贊成、隊外反對；只點選偏離預設的玩家（場外白／場內黑）。'}
              </p>
              <SeatGrid>
                {game.players.map((p, i) => {
                  const inTeam = draft.team.includes(p.id)
                  const vote = votes[p.id]!
                  const flagged = draft.flags.includes(p.id)
                  const anomaly = inTeam ? vote === 'reject' : vote === 'approve'
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={flagged}
                      aria-label={`${p.name}，${inTeam ? '隊員' : '非隊員'}，${vote === 'approve' ? '贊成' : '反對'}`}
                      onClick={() => setDraft((d) => toggleFlag(d, p.id))}
                      className={cx(
                        'flex min-h-12 items-center gap-2 rounded-xl border-2 px-2.5 text-left',
                        vote === 'approve'
                          ? 'border-approve bg-approve/15'
                          : 'border-transparent bg-surface0',
                        draft.mode === 'anomalies' &&
                          anomaly &&
                          (inTeam
                            ? 'border-inside-reject bg-inside-reject/15'
                            : 'border-outside-approve bg-outside-approve/15'),
                      )}
                    >
                      <SeatNo n={i + 1} />
                      <span className="min-w-0 flex-1 truncate">
                        {p.name}
                        {inTeam && (
                          <span className="ml-1 align-middle">
                            <TeamMark size={14} />
                          </span>
                        )}
                      </span>
                      {draft.mode === 'anomalies' && anomaly ? (
                        <AnomalyMark
                          kind={inTeam ? 'inside-reject' : 'outside-approve'}
                          size={20}
                          showLabel
                        />
                      ) : (
                        <VoteMark vote={vote} size={20} />
                      )}
                    </button>
                  )
                })}
              </SeatGrid>
              <div className="mt-1.5 flex gap-2">
                <Button
                  variant="ghost"
                  className="min-h-9 flex-1 text-sm"
                  onClick={() => setDraft((d) => setAll(d, 'approve', ids))}
                >
                  全部贊成
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-9 flex-1 text-sm"
                  onClick={() => setDraft((d) => setAll(d, 'reject', ids))}
                >
                  全部反對
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      <div className="flex-1" />
      <BottomBar>
        {step === 'vote' && (
          <p className="mb-1.5 flex items-center justify-center gap-2 text-sm" aria-live="polite">
            <span>
              贊成 <strong>{approvals}</strong> / {ids.length}
            </span>
            <span className={cx('font-semibold', passes ? 'text-success-fg' : 'text-fail-fg')}>
              {passes ? '→ 通過' : state.forced ? '→ 否決，壞人勝利' : '→ 否決'}
            </span>
          </p>
        )}
        {step === 'team' ? (
          <Button
            variant="primary"
            className="w-full"
            disabled={!teamFull}
            onClick={() => setStep('vote')}
          >
            {teamFull ? '下一步：記錄投票' : `再選 ${state.teamSize - draft.team.length} 位隊員`}
            <IconArrowRight size={20} aria-hidden />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setStep('team')} aria-label="返回選隊員">
              <IconArrowLeft size={20} aria-hidden />
            </Button>
            <Button variant="primary" className="flex-1" onClick={submit}>
              <IconSend size={20} aria-hidden />
              送出派票
            </Button>
          </div>
        )}
      </BottomBar>

      <Sheet title="更換隊長" open={pickingLeader} onClose={() => setPickingLeader(false)}>
        <div className="grid grid-cols-2 gap-2">
          {game.players.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === leaderId}
              onClick={() => {
                setLeaderId(p.id)
                setPickingLeader(false)
              }}
              className={cx(
                'flex min-h-12 items-center gap-2 rounded-xl border-2 px-2.5 text-left',
                p.id === leaderId ? 'border-crown bg-crown/15' : 'border-transparent bg-surface0',
              )}
            >
              <SeatNo n={i + 1} />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              {p.id === leaderId && <CrownMark />}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-subtext0">
          之後的隊長從 {game.players.find((p) => p.id === nextSeat(game, leaderId))?.name}{' '}
          開始依序輪替
        </p>
      </Sheet>
    </div>
  )
}

export function SeatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-1.5">{children}</div>
}

export function SeatNo({ n }: { n: number }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-base text-xs text-subtext0">
      {n}
    </span>
  )
}
