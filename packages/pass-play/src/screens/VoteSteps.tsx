import { cx } from '@avalon/ui'
import { CardBack } from '../CardBack.tsx'
import { VOTE_MARK } from '../marks.tsx'
import { voteOrder, type VoteAction, type VoteFlow } from '../vote.ts'

/**
 * A team vote in private: the voter holds the card back, taps 同意 or 反對 (in a random
 * order) and hands the phone on. Once everyone has voted, holding the card reveals them all.
 */
export function VoteSteps({
  flow,
  dispatch,
  who,
  onShow,
}: {
  flow: Extract<VoteFlow, { step: 'handoff' | 'choose' | 'collected' }>
  dispatch: (action: VoteAction) => void
  who: (index: number) => string
  /** Called when the collected votes are revealed. */
  onShow?: () => void
}) {
  if (flow.step === 'collected') {
    return (
      <>
        <p className="text-center text-2xl">所有玩家已投票</p>
        <CardBack label="長按公布投票結果" onReveal={() => onShow?.()} />
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
          label="長按投票"
          onReveal={() => dispatch({ type: 'reveal', order: voteOrder() })}
        />
      </div>
    )
  }
  return (
    <div key={`choose-${flow.index}`} className="flex w-full max-w-xs flex-col gap-4">
      <p className="text-center text-lg text-subtext1">是否同意這個隊伍出任務？</p>
      {flow.order.map((vote) => {
        const { label, icon: Icon, text, border, tint } = VOTE_MARK[vote]
        return (
          <button
            key={vote}
            type="button"
            onClick={() => dispatch({ type: 'vote', vote })}
            className={cx(
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
