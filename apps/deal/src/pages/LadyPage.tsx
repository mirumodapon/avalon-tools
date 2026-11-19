import { FACTION_LABEL, PLAYER_COUNTS, type PlayerCount } from '@avalon/rules'
import {
  AppShell,
  BottomBar,
  Button,
  Card,
  ConfirmSheet,
  FACTION_ICONS,
  IconButton,
  SectionTitle,
  Segmented,
  cx,
} from '@avalon/ui'
import { IconRipple, IconX } from '@tabler/icons-react'
import { useCallback, useState } from 'react'
import { CardBack } from '../components/CardBack.tsx'
import { SeatPicker } from '../components/SeatPicker.tsx'
import { useDoubleTap } from '../hooks/useDoubleTap.ts'
import { usePrivacyGuard } from '../hooks/usePrivacyGuard.ts'
import { eligibleTargets, loyaltyOrder, MAX_LADY_USES, usesOf, type Loyalty } from '../lady/lady.ts'
import { useLady } from '../lady/store.ts'
import { navigate } from '../router.ts'
import { useSettings } from '../settings.ts'

const FACTION_TEXT: Record<Loyalty, string> = { good: 'text-good-fg', evil: 'text-evil-fg' }

function LadySetup() {
  const { state, dispatch, setPlayerCount } = useLady()
  const stored = useLady((s) => s.playerCount)
  const defaultCount = useSettings((s) => s.settings.playerCount)
  const playerCount = stored ?? defaultCount
  const current = state.holders.at(-1)
  const [initial, setInitial] = useState<number | null>(null)
  const [target, setTarget] = useState<number | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const holder = current ?? initial
  const used = usesOf(state.holders)
  const full = used >= MAX_LADY_USES
  const allowed = holder === null ? [] : eligibleTargets(playerCount, state.holders, holder)
  const seats = Array.from({ length: playerCount }, (_, i) => i + 1)

  return (
    <AppShell title="湖中女神" onBack={() => navigate({ name: 'setup' })}>
      <div className="space-y-4 pt-2">
        <Card>
          <SectionTitle>玩家人數</SectionTitle>
          <Segmented
            label="玩家人數"
            value={String(playerCount)}
            options={PLAYER_COUNTS.map((n) => ({ value: String(n), label: `${n}` }))}
            onChange={(v) => {
              setPlayerCount(Number(v) as PlayerCount)
              setInitial(null)
              setTarget(null)
            }}
          />
        </Card>

        <Card>
          <SectionTitle
            action={
              state.holders.length > 0 && (
                <button
                  type="button"
                  className="text-sm text-subtext0"
                  onClick={() => setConfirmReset(true)}
                >
                  重新開始
                </button>
              )
            }
          >
            湖中女神持有者
            <span className="ml-2 font-normal text-subtext0">
              已使用 {used} / {MAX_LADY_USES} 次
            </span>
          </SectionTitle>
          {current === undefined ? (
            <SeatPicker
              count={playerCount}
              selected={initial === null ? [] : [initial]}
              onToggle={(s) => {
                setInitial(s === initial ? null : s)
                setTarget(null)
              }}
              label="持有者"
            />
          ) : (
            <p className="text-lg">
              目前在 <strong className="text-accent-fg">{current} 號</strong> 手上
              {state.holders.length > 1 && (
                <span className="ml-2 text-sm text-subtext0">
                  （曾持有：{state.holders.slice(0, -1).join('、')} 號）
                </span>
              )}
            </p>
          )}
        </Card>

        {holder !== null && !full && (
          <Card>
            <SectionTitle>要查驗誰</SectionTitle>
            <SeatPicker
              count={playerCount}
              selected={target === null ? [] : [target]}
              disabled={seats.filter((s) => !allowed.includes(s))}
              onToggle={(s) => setTarget(s === target ? null : s)}
              label="查驗對象"
            />
            <p className="mt-2 text-sm text-subtext0">不能查驗自己或曾經持有湖中女神的人</p>
          </Card>
        )}
        {full && (
          <p className="text-center text-subtext1">這一局的湖中女神已經用完 {MAX_LADY_USES} 次</p>
        )}
      </div>

      <BottomBar>
        <Button
          variant="primary"
          className="w-full"
          disabled={holder === null || target === null || full}
          onClick={() =>
            holder !== null && target !== null && dispatch({ type: 'start', holder, target })
          }
        >
          <IconRipple size={20} aria-hidden />
          {target === null ? '選擇查驗對象' : `查驗 ${target} 號`}
        </Button>
      </BottomBar>

      <ConfirmSheet
        open={confirmReset}
        title="重新開始湖中女神？"
        message="會清除這一局誰持有過湖中女神。"
        confirmLabel="重新開始"
        onConfirm={() => {
          dispatch({ type: 'reset' })
          setInitial(null)
          setTarget(null)
        }}
        onClose={() => setConfirmReset(false)}
      />
    </AppShell>
  )
}

function Handoff({ seat, who }: { seat: number; who: string }) {
  return (
    <p className="text-center text-2xl">
      請將手機交給 <strong className="text-accent-fg">{seat} 號玩家</strong>
      <span className="mt-1 block text-lg text-subtext1">{who}</span>
    </p>
  )
}

/** What the inspected player showed, for the holder's eyes only. Double tap to cover. */
function LoyaltyCard({
  target,
  shown,
  onCover,
}: {
  target: number
  shown: Loyalty
  onCover: () => void
}) {
  const tap = useDoubleTap(onCover)
  const Icon = FACTION_ICONS[shown]
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        aria-label={`${target} 號亮出${FACTION_LABEL[shown]}，雙擊蓋上`}
        onClick={tap}
        onContextMenu={(e) => e.preventDefault()}
        className={cx(
          'no-select animate-flip-in flex aspect-[3/4] w-60 flex-col items-center justify-center gap-4 rounded-3xl border-4 bg-mantle',
          shown === 'good' ? 'border-good' : 'border-evil',
        )}
      >
        <span className="text-lg text-subtext1">{target} 號亮出</span>
        <Icon size={64} className={FACTION_TEXT[shown]} aria-hidden />
        <span className={cx('text-4xl font-bold', FACTION_TEXT[shown])}>
          {FACTION_LABEL[shown]}
        </span>
      </button>
      <p className="text-lg text-subtext1">看完後雙擊卡片蓋上</p>
    </div>
  )
}

export function LadyPage() {
  const { state, dispatch } = useLady()
  const { flow } = state
  const [confirmStop, setConfirmStop] = useState(false)
  const active =
    flow.step === 'toTarget' ||
    flow.step === 'declare' ||
    flow.step === 'toHolder' ||
    flow.step === 'reveal'
  const hide = useCallback(() => dispatch({ type: 'hide' }), [dispatch])
  usePrivacyGuard(active, hide)

  if (flow.step === 'setup') return <LadySetup />

  if (flow.step === 'passed') {
    const used = usesOf(state.holders)
    return (
      <AppShell title="湖中女神" onBack={() => dispatch({ type: 'close' })}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
          <IconRipple size={64} className="text-lady-fg" aria-hidden />
          <p className="text-2xl font-bold">湖中女神交給 {flow.target} 號</p>
          <p className="text-subtext1">
            已使用 {used} / {MAX_LADY_USES} 次
          </p>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <Button variant="primary" onClick={() => dispatch({ type: 'close' })}>
              {used < MAX_LADY_USES ? '下一次湖中女神' : '回到湖中女神'}
            </Button>
            <Button onClick={() => navigate({ name: 'setup' })}>回到發牌</Button>
          </div>
        </div>
      </AppShell>
    )
  }

  const stop = (
    <IconButton label="結束這次查驗" onClick={() => setConfirmStop(true)}>
      <IconX size={22} />
    </IconButton>
  )

  return (
    <AppShell
      title={`湖中女神・${flow.holder} 號查驗 ${flow.target} 號`}
      homeHref={null}
      actions={stop}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
        {flow.step === 'toTarget' && (
          <div key="toTarget" className="flex flex-col items-center gap-6">
            <Handoff seat={flow.target} who="被查驗的人" />
            <CardBack
              label="長按選擇要亮出的身分"
              onReveal={() => dispatch({ type: 'showChoices', order: loyaltyOrder() })}
            />
          </div>
        )}
        {flow.step === 'declare' && (
          <div key="declare" className="flex w-full max-w-xs flex-col gap-4">
            <p className="text-center text-lg text-subtext1">
              {flow.target} 號，要讓 {flow.holder} 號看到
            </p>
            {flow.order.map((loyalty) => (
              <button
                key={loyalty}
                type="button"
                onClick={() => dispatch({ type: 'declare', loyalty })}
                className="no-select flex h-28 items-center justify-center rounded-3xl border-2 border-surface2 bg-mantle text-2xl font-bold"
              >
                {FACTION_LABEL[loyalty]}
              </button>
            ))}
          </div>
        )}
        {flow.step === 'toHolder' && (
          <div key="toHolder" className="flex flex-col items-center gap-6">
            <Handoff seat={flow.holder} who="湖中女神持有者" />
            <CardBack
              label={`長按查看 ${flow.target} 號的身分`}
              onReveal={() => dispatch({ type: 'reveal' })}
            />
          </div>
        )}
        {flow.step === 'reveal' && (
          <LoyaltyCard
            key="reveal"
            target={flow.target}
            shown={flow.shown}
            onCover={() => dispatch({ type: 'confirm' })}
          />
        )}
      </div>
      <ConfirmSheet
        open={confirmStop}
        title="結束這次查驗？"
        message="這次查驗不會算進使用次數，湖中女神留在原持有者手上。"
        confirmLabel="結束"
        danger
        onConfirm={() => dispatch({ type: 'close' })}
        onClose={() => setConfirmStop(false)}
      />
    </AppShell>
  )
}
