import { CardBack } from '../CardBack.tsx'
import type { Flow, FlowAction } from '../deal.ts'
import { RoleCard } from '../RoleCard.tsx'

/**
 * The card for the player whose turn it is: face down until held, then their role until they
 * double-tap it closed. `who(index)` names that player in the hand-off line.
 */
export function DealSteps({
  flow,
  dispatch,
  who,
}: {
  flow: Extract<Flow, { step: 'handoff' | 'reveal' }>
  dispatch: (action: FlowAction) => void
  who: (index: number) => string
}) {
  const self = flow.table[flow.index]!
  return flow.step === 'handoff' ? (
    // key: a fresh card for every player, nothing carried over.
    <div key={`handoff-${flow.index}`} className="flex flex-col items-center gap-6">
      <p className="text-center text-2xl">
        請將手機交給 <strong className="text-accent-fg">{who(flow.index)}</strong>
      </p>
      <CardBack onReveal={() => dispatch({ type: 'reveal' })} />
    </div>
  ) : (
    <RoleCard
      key={`reveal-${flow.index}`}
      self={self}
      table={flow.table}
      onCover={() => dispatch({ type: 'confirm' })}
    />
  )
}
