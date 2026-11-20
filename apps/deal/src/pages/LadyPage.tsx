import { AppShell, Button, ConfirmSheet, IconButton, cx } from '@avalon/ui'
import { IconRipple, IconX } from '@tabler/icons-react'
import { useCallback, useState } from 'react'
import { CardBack } from '../components/CardBack.tsx'
import { LADY_MARK } from '../components/marks.tsx'
import { useDoubleTap } from '../hooks/useDoubleTap.ts'
import { usePrivacyGuard } from '../hooks/usePrivacyGuard.ts'
import { loyaltyOrder, type Loyalty } from '@avalon/pass-play'
import { useLady } from '../lady/store.ts'

function Handoff({ who }: { who: string }) {
  return (
    <p className="text-center text-2xl">
      請將手機交給 <strong className="text-accent-fg">{who}</strong>
    </p>
  )
}

/** What the inspected player showed, for the holder's eyes only. Double tap to cover. */
function LoyaltyCard({ shown, onCover }: { shown: Loyalty; onCover: () => void }) {
  const tap = useDoubleTap(onCover)
  const { label, icon: Icon, text, border } = LADY_MARK[shown]
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        aria-label={`亮出${label}，雙擊蓋上`}
        onClick={tap}
        onContextMenu={(e) => e.preventDefault()}
        className={cx(
          'no-select animate-flip-in flex aspect-[3/4] w-60 flex-col items-center justify-center gap-4 rounded-3xl border-4 bg-mantle',
          border,
        )}
      >
        <span className="text-lg text-subtext1">對方亮出</span>
        <Icon size={64} className={text} aria-hidden />
        <span className={cx('text-4xl font-bold', text)}>{label}</span>
      </button>
      <p className="text-lg text-subtext1">看完後雙擊卡片蓋上</p>
    </div>
  )
}

/** A Lady of the Lake use in progress: the inspected player chooses, the holder looks. */
export function LadyPage() {
  const flow = useLady((s) => s.flow)
  const dispatch = useLady((s) => s.dispatch)
  const [confirmStop, setConfirmStop] = useState(false)
  const active =
    flow.step === 'toTarget' ||
    flow.step === 'declare' ||
    flow.step === 'toHolder' ||
    flow.step === 'reveal'
  const hide = useCallback(() => dispatch({ type: 'hide' }), [dispatch])
  usePrivacyGuard(active, hide)

  if (flow.step === 'idle') return null
  const close = () => dispatch({ type: 'close' })

  if (flow.step === 'passed') {
    return (
      <AppShell title="湖中女神" onBack={close}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
          <IconRipple size={64} className="text-lady-fg" aria-hidden />
          <p className="text-2xl font-bold">湖中女神交給被查驗的玩家</p>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <Button variant="primary" onClick={() => dispatch({ type: 'start' })}>
              再查驗一次
            </Button>
            <Button onClick={close}>回到設定</Button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="湖中女神"
      homeHref={null}
      actions={
        <IconButton label="結束這次查驗" onClick={() => setConfirmStop(true)}>
          <IconX size={22} />
        </IconButton>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
        {flow.step === 'toTarget' && (
          <div key="toTarget" className="flex flex-col items-center gap-6">
            <Handoff who="被查驗的玩家" />
            <CardBack
              label="長按選擇要亮出的身分"
              onReveal={() => dispatch({ type: 'showChoices', order: loyaltyOrder() })}
            />
          </div>
        )}
        {flow.step === 'declare' && (
          <div key="declare" className="flex w-full max-w-xs flex-col gap-4">
            <p className="text-center text-lg text-subtext1">選擇要讓湖中女神持有者看到的身分</p>
            {flow.order.map((loyalty) => {
              const { label, icon: Icon, text, border } = LADY_MARK[loyalty]
              return (
                <button
                  key={loyalty}
                  type="button"
                  onClick={() => dispatch({ type: 'declare', loyalty })}
                  className={cx(
                    // Same look as the faction on a dealt role card.
                    'no-select flex h-28 items-center justify-center gap-3 rounded-3xl border-2 bg-mantle text-2xl font-bold',
                    border,
                    text,
                  )}
                >
                  <Icon size={32} aria-hidden />
                  {label}
                </button>
              )
            })}
          </div>
        )}
        {flow.step === 'toHolder' && (
          <div key="toHolder" className="flex flex-col items-center gap-6">
            <Handoff who="湖中女神持有者" />
            <CardBack label="長按查看對方的身分" onReveal={() => dispatch({ type: 'reveal' })} />
          </div>
        )}
        {flow.step === 'reveal' && (
          <LoyaltyCard
            key="reveal"
            shown={flow.shown}
            onCover={() => dispatch({ type: 'confirm' })}
          />
        )}
      </div>
      <ConfirmSheet
        open={confirmStop}
        title="結束這次查驗？"
        message="這次的選擇不會保留。"
        confirmLabel="結束"
        danger
        onConfirm={close}
        onClose={() => setConfirmStop(false)}
      />
    </AppShell>
  )
}
