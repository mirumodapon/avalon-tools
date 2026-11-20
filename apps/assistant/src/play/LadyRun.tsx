import { LadySteps, ladyReducer, usePrivacyGuard, type LadyFlow } from '@avalon/pass-play'
import {
  ladyTargetOptions,
  playerFaction,
  type Game,
  type LadyDeclaration,
  type PlayerId,
} from '@avalon/record-core'
import type { Faction } from '@avalon/rules'
import { BottomBar, Button } from '@avalon/ui'
import { useCallback, useEffect, useReducer, useState } from 'react'
import { seatLabel } from '../seat.ts'
import { SeatGrid } from './SeatGrid.tsx'

const DECLARATIONS: { value: LadyDeclaration; label: string }[] = [
  { value: 'good', label: '宣告好人' },
  { value: 'evil', label: '宣告壞人' },
  { value: 'none', label: '不宣告' },
]

/**
 * The holder's private look at the target's real faction (the roles are known here, so the
 * target has nothing to choose): hold to reveal, double-tap to cover.
 */
function TrueFaction({
  game,
  target,
  holder,
  faction,
  onSeen,
}: {
  game: Game
  target: PlayerId
  holder: string
  faction: Faction
  onSeen: () => void
}) {
  const [flow, dispatch] = useReducer(ladyReducer, { step: 'toHolder', shown: faction } as LadyFlow)
  const hide = useCallback(() => dispatch({ type: 'hide' }), [])
  usePrivacyGuard(flow.step === 'reveal', hide)
  const name = seatLabel(game, target)
  useEffect(() => {
    if (flow.step === 'passed') onSeen()
  }, [flow.step, onSeen])
  if (flow.step !== 'toHolder' && flow.step !== 'reveal') return null
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
      <LadySteps
        flow={flow}
        dispatch={dispatch}
        target={name}
        holder={holder}
        revealLabel={`長按查看 ${name}的陣營`}
        caption={`${name}的真實陣營`}
      />
    </div>
  )
}

/**
 * The Lady after a quest: the holder picks whom to inspect, holds the card to see that
 * player's real faction, then announces something in public. Only the announcement is
 * recorded in the game; the target and the look are saved progress, so a reload comes back
 * to the same step (the card face down).
 */
export function LadyRun({
  game,
  holderId,
  progress,
  onProgress,
  onDone,
}: {
  game: Game
  holderId: PlayerId
  /** The confirmed target and whether the holder has looked (saved by the caller). */
  progress: { target: PlayerId; seen: boolean } | null
  onProgress: (target: PlayerId, seen: boolean) => void
  onDone: (targetId: PlayerId, declared: LadyDeclaration) => void
}) {
  // The seat being picked; it becomes the saved target once 查驗 is pressed.
  const [picked, setPicked] = useState<PlayerId | null>(null)
  const holder = seatLabel(game, holderId)

  if (!progress) {
    const target = picked
    const options = ladyTargetOptions(game, game.lady?.uses.length ?? 0, holderId)
    return (
      <>
        <p className="text-lg font-bold">湖中女神持有者：{holder}</p>
        <p className="text-subtext1">選擇要查驗的玩家</p>
        <SeatGrid
          game={game}
          selected={target ? [target] : []}
          onToggle={(id) => setPicked(id === target ? null : id)}
          disabled={(id) => options.find((o) => o.playerId === id)?.disabledReason ?? null}
        />
        <BottomBar>
          <Button
            variant="primary"
            className="w-full"
            disabled={!target}
            onClick={() => target && onProgress(target, false)}
          >
            查驗
          </Button>
        </BottomBar>
      </>
    )
  }

  const { target, seen } = progress
  if (!seen) {
    return (
      <TrueFaction
        game={game}
        target={target}
        holder={holder}
        faction={playerFaction(game, target) ?? 'good'}
        onSeen={() => onProgress(target, true)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4 py-6">
      <p className="text-center text-2xl font-bold">請 {holder} 公開宣告</p>
      <p className="text-center text-subtext1">查驗了 {seatLabel(game, target)}</p>
      {DECLARATIONS.map(({ value, label }) => (
        <Button key={value} onClick={() => onDone(target, value)}>
          {label}
        </Button>
      ))}
    </div>
  )
}
