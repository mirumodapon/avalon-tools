import { PLAYER_COUNTS, type PlayerCount } from '@avalon/rules'
import {
  AppShell,
  BottomBar,
  Button,
  Card,
  ConfirmSheet,
  IconButton,
  SectionTitle,
  Segmented,
  cx,
} from '@avalon/ui'
import { IconCheck, IconFlag, IconX } from '@tabler/icons-react'
import { useCallback, useState } from 'react'
import { CardBack } from '../components/CardBack.tsx'
import { SeatPicker } from '../components/SeatPicker.tsx'
import { shuffle } from '../deal/shuffle.ts'
import { usePrivacyGuard } from '../hooks/usePrivacyGuard.ts'
import { cardOrder, checkTeam, playedCards, questOutcome, type QuestCard } from '../quest/quest.ts'
import { useQuest } from '../quest/store.ts'
import { navigate } from '../router.ts'
import { useSettings } from '../settings.ts'

const QUEST_OPTIONS = [0, 1, 2, 3, 4].map((i) => ({ value: String(i), label: `${i + 1}` }))
const CARD_LABEL: Record<QuestCard, string> = { success: '任務成功', fail: '任務失敗' }
const CARD_ICON = { success: IconCheck, fail: IconX }

function QuestSetupView() {
  const draft = useQuest((s) => s.draft)
  const setDraft = useQuest((s) => s.setDraft)
  const dispatch = useQuest((s) => s.dispatch)
  const defaultCount = useSettings((s) => s.settings.playerCount)
  const playerCount = draft.playerCount ?? defaultCount
  const setup = { playerCount, questIndex: draft.questIndex, team: draft.team }
  const check = checkTeam(setup)

  const toggle = (seat: number) =>
    setDraft({
      team: draft.team.includes(seat)
        ? draft.team.filter((s) => s !== seat)
        : [...draft.team, seat].toSorted((a, b) => a - b),
    })

  return (
    <AppShell title="出任務" onBack={() => navigate({ name: 'setup' })}>
      <div className="space-y-4 pt-2">
        <Card>
          <SectionTitle>玩家人數</SectionTitle>
          <Segmented
            label="玩家人數"
            value={String(playerCount)}
            options={PLAYER_COUNTS.map((n) => ({ value: String(n), label: `${n}` }))}
            onChange={(v) => {
              const n = Number(v) as PlayerCount
              setDraft({ playerCount: n, team: draft.team.filter((s) => s <= n) })
            }}
          />
        </Card>
        <Card>
          <SectionTitle>第幾個任務</SectionTitle>
          <Segmented
            label="第幾個任務"
            value={String(draft.questIndex)}
            options={QUEST_OPTIONS}
            onChange={(v) => setDraft({ questIndex: Number(v) })}
          />
          <p className="mt-3 text-sm text-subtext1">
            第 {draft.questIndex + 1} 個任務需要 {check.size} 位隊員
            {check.failsRequired > 1 && (
              <span className="text-forced-fg">，要 {check.failsRequired} 張失敗才算失敗</span>
            )}
          </p>
        </Card>
        <Card>
          <SectionTitle>
            選擇隊員
            <span className="ml-2 font-normal text-subtext0 tabular-nums">
              {draft.team.length} / {check.size}
            </span>
          </SectionTitle>
          <SeatPicker count={playerCount} selected={draft.team} onToggle={toggle} label="隊員" />
        </Card>
      </div>
      <BottomBar>
        {check.message && <p className="mb-2 text-sm text-subtext0">{check.message}</p>}
        <Button
          variant="primary"
          className="w-full"
          disabled={!check.ok}
          onClick={() => dispatch({ type: 'start', setup })}
        >
          <IconFlag size={20} aria-hidden />
          開始出任務
        </Button>
      </BottomBar>
    </AppShell>
  )
}

export function QuestPage() {
  const flow = useQuest((s) => s.flow)
  const dispatch = useQuest((s) => s.dispatch)
  const setDraft = useQuest((s) => s.setDraft)
  const [confirmStop, setConfirmStop] = useState(false)
  const voting = flow.step === 'handoff' || flow.step === 'choose' || flow.step === 'collected'
  const hide = useCallback(() => dispatch({ type: 'hide' }), [dispatch])
  usePrivacyGuard(voting, hide)

  if (flow.step === 'setup') return <QuestSetupView />

  const { setup } = flow
  const stop = (
    <IconButton label="結束出任務" onClick={() => setConfirmStop(true)}>
      <IconX size={22} />
    </IconButton>
  )
  const stopSheet = (
    <ConfirmSheet
      open={confirmStop}
      title="結束出任務？"
      message="已出的牌不會保留，需要重新出任務。"
      confirmLabel="結束"
      danger
      onConfirm={() => dispatch({ type: 'reset' })}
      onClose={() => setConfirmStop(false)}
    />
  )

  if (flow.step === 'result') {
    const { succeeded, failsRequired } = questOutcome(setup, flow.fails)
    const next = setup.questIndex + 1
    return (
      <AppShell
        title={`第 ${setup.questIndex + 1} 個任務`}
        onBack={() => dispatch({ type: 'reset' })}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
          <p className={cx('text-4xl font-bold', succeeded ? 'text-success-fg' : 'text-fail-fg')}>
            {succeeded ? '任務成功' : '任務失敗'}
          </p>
          <ul className="flex flex-wrap justify-center gap-2" aria-label="出的牌">
            {flow.cards.map((card, i) => {
              const Icon = CARD_ICON[card]
              return (
                <li
                  key={i}
                  aria-label={CARD_LABEL[card]}
                  className={cx(
                    'flex h-20 w-14 items-center justify-center rounded-xl border-2 bg-mantle',
                    card === 'success'
                      ? 'border-success text-success-fg'
                      : 'border-fail text-fail-fg',
                  )}
                >
                  <Icon size={28} aria-hidden />
                </li>
              )
            })}
          </ul>
          <p className="text-lg text-subtext1">
            {flow.fails === 0 ? '沒有失敗' : `${flow.fails} 張失敗`}
            {succeeded && flow.fails > 0 && `（這個任務需要 ${failsRequired} 張失敗）`}
          </p>
          <div className="flex w-full max-w-xs flex-col gap-3">
            {next < 5 && (
              <Button
                variant="primary"
                onClick={() => {
                  setDraft({ questIndex: next, team: [] })
                  dispatch({ type: 'reset' })
                }}
              >
                下一個任務
              </Button>
            )}
            <Button
              onClick={() => {
                dispatch({ type: 'reset' })
                navigate({ name: 'setup' })
              }}
            >
              回到發牌
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  if (flow.step === 'collected') {
    return (
      <AppShell title="出任務" homeHref={null} actions={stop}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
          <p className="text-center text-2xl">所有隊員已出牌</p>
          <CardBack
            label="長按公布結果"
            onReveal={() =>
              dispatch({ type: 'show', cards: shuffle(playedCards(setup.team.length, flow.fails)) })
            }
          />
        </div>
        {stopSheet}
      </AppShell>
    )
  }

  const seat = setup.team[flow.index]!
  return (
    <AppShell
      title={`出任務・第 ${flow.index + 1} / ${setup.team.length} 位`}
      homeHref={null}
      actions={stop}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
        {flow.step === 'handoff' ? (
          <div key={`handoff-${flow.index}`} className="flex flex-col items-center gap-6">
            <p className="text-center text-2xl">
              請將手機交給 <strong className="text-accent-fg">{seat} 號玩家</strong>
            </p>
            <CardBack
              label="長按出牌"
              onReveal={() => dispatch({ type: 'reveal', order: cardOrder() })}
            />
          </div>
        ) : (
          <div key={`choose-${flow.index}`} className="flex w-full max-w-xs flex-col gap-4">
            <p className="text-center text-lg text-subtext1">{seat} 號，請選擇要出的牌</p>
            {flow.order.map((card) => {
              const Icon = CARD_ICON[card]
              return (
                <button
                  key={card}
                  type="button"
                  onClick={() => dispatch({ type: 'play', card })}
                  className="no-select flex h-28 items-center justify-center gap-3 rounded-3xl border-2 border-surface2 bg-mantle text-2xl font-bold"
                >
                  <Icon size={32} aria-hidden />
                  {CARD_LABEL[card]}
                </button>
              )
            })}
          </div>
        )}
      </div>
      {stopSheet}
    </AppShell>
  )
}
