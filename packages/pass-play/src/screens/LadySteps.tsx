import { cx } from '@avalon/ui'
import { CardBack } from '../CardBack.tsx'
import { loyaltyOrder, type LadyAction, type LadyFlow, type Loyalty } from '../lady.ts'
import { LADY_MARK } from '../marks.tsx'
import { useDoubleTap } from '../useDoubleTap.ts'

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

/**
 * One use of the Lady in private: the inspected player (`target`) chooses what to show, then
 * the holder (`holder`) holds the card back to look and double-taps it closed.
 */
export function LadySteps({
  flow,
  dispatch,
  target,
  holder,
}: {
  flow: Extract<LadyFlow, { step: 'toTarget' | 'declare' | 'toHolder' | 'reveal' }>
  dispatch: (action: LadyAction) => void
  target: string
  holder: string
}) {
  switch (flow.step) {
    case 'toTarget':
      return (
        <div key="toTarget" className="flex flex-col items-center gap-6">
          <Handoff who={target} />
          <CardBack
            label="長按選擇要亮出的身分"
            onReveal={() => dispatch({ type: 'showChoices', order: loyaltyOrder() })}
          />
        </div>
      )
    case 'declare':
      return (
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
      )
    case 'toHolder':
      return (
        <div key="toHolder" className="flex flex-col items-center gap-6">
          <Handoff who={holder} />
          <CardBack label="長按查看對方的身分" onReveal={() => dispatch({ type: 'reveal' })} />
        </div>
      )
    case 'reveal':
      return (
        <LoyaltyCard
          key="reveal"
          shown={flow.shown}
          onCover={() => dispatch({ type: 'confirm' })}
        />
      )
  }
}
