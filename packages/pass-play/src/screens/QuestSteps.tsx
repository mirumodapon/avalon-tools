import { cx } from '@avalon/ui'
import { CardBack } from '../CardBack.tsx'
import { QUEST_CARD } from '../marks.tsx'
import { cardOrder, type QuestAction, type QuestFlow } from '../quest.ts'

/**
 * Quest cards in private: the member whose turn it is holds the card back, picks a card (the
 * two buttons in a random order), then the phone moves on. Once everyone has played, holding
 * the card back reveals the result.
 */
export function QuestSteps({
  flow,
  dispatch,
  who,
}: {
  flow: Extract<QuestFlow, { step: 'handoff' | 'choose' | 'collected' }>
  dispatch: (action: QuestAction) => void
  who: (index: number) => string
}) {
  if (flow.step === 'collected') {
    return (
      <>
        <p className="text-center text-2xl">所有隊員已出牌</p>
        <CardBack label="長按公布結果" onReveal={() => dispatch({ type: 'show' })} />
      </>
    )
  }
  if (flow.step === 'handoff') {
    return (
      <div key={`handoff-${flow.index}`} className="flex flex-col items-center gap-6">
        <p className="text-center text-2xl">
          請將手機交給
          <strong className="mt-1 block text-accent-fg">{who(flow.index)}</strong>
        </p>
        <CardBack
          label="長按出牌"
          onReveal={() => dispatch({ type: 'reveal', order: cardOrder() })}
        />
      </div>
    )
  }
  return (
    <div key={`choose-${flow.index}`} className="flex w-full max-w-xs flex-col gap-4">
      <p className="text-center text-lg text-subtext1">請選擇要出的牌</p>
      {flow.order.map((card) => {
        const { label, icon: Icon, text, border, tint } = QUEST_CARD[card]
        return (
          <button
            key={card}
            type="button"
            onClick={() => dispatch({ type: 'play', card })}
            className={cx(
              // Colour on the border, icon and tint; the label keeps full contrast so
              // neither choice looks disabled.
              'no-select flex h-28 items-center justify-center gap-3 rounded-3xl border-2 text-2xl font-bold text-text',
              border,
              tint,
            )}
          >
            <Icon size={32} className={text} aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
