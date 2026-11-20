import { LADY_IDLE, LadySteps, ladyReducer, usePrivacyGuard } from '@avalon/pass-play'
import {
  ladyTargetOptions,
  type Game,
  type LadyDeclaration,
  type PlayerId,
} from '@avalon/record-core'
import { BottomBar, Button } from '@avalon/ui'
import { useCallback, useReducer, useState } from 'react'
import { seatLabel } from '../seat.ts'
import { SeatGrid } from './SeatGrid.tsx'

const DECLARATIONS: { value: LadyDeclaration; label: string }[] = [
  { value: 'good', label: '宣告好人' },
  { value: 'evil', label: '宣告壞人' },
  { value: 'none', label: '不宣告' },
]

/**
 * The Lady after a quest: the holder picks whom to inspect, that player chooses in private
 * what to show, the holder looks, then announces it in public. Only the announcement is
 * recorded; a reload goes back to picking the target.
 */
export function LadyRun({
  game,
  holderId,
  onDone,
}: {
  game: Game
  holderId: PlayerId
  onDone: (targetId: PlayerId, declared: LadyDeclaration) => void
}) {
  const [target, setTarget] = useState<PlayerId | null>(null)
  const [flow, dispatch] = useReducer(ladyReducer, LADY_IDLE)
  const hide = useCallback(() => dispatch({ type: 'hide' }), [])
  const secret =
    flow.step === 'toTarget' ||
    flow.step === 'declare' ||
    flow.step === 'toHolder' ||
    flow.step === 'reveal'
  usePrivacyGuard(secret, hide)
  const holder = seatLabel(game, holderId)

  if (flow.step === 'idle') {
    const options = ladyTargetOptions(game, game.lady?.uses.length ?? 0, holderId)
    return (
      <>
        <p className="text-lg font-bold">湖中女神持有者：{holder}</p>
        <p className="text-subtext1">選擇要查驗的玩家</p>
        <SeatGrid
          game={game}
          selected={target ? [target] : []}
          onToggle={(id) => setTarget(id === target ? null : id)}
          disabled={(id) => options.find((o) => o.playerId === id)?.disabledReason ?? null}
        />
        <BottomBar>
          <Button
            variant="primary"
            className="w-full"
            disabled={!target}
            onClick={() => dispatch({ type: 'start' })}
          >
            查驗
          </Button>
        </BottomBar>
      </>
    )
  }

  if (flow.step === 'passed') {
    return (
      <div className="flex flex-col gap-4 py-6">
        <p className="text-center text-2xl font-bold">請 {holder} 公開宣告</p>
        <p className="text-center text-subtext1">查驗了 {seatLabel(game, target!)}</p>
        {DECLARATIONS.map(({ value, label }) => (
          <Button key={value} onClick={() => onDone(target!, value)}>
            {label}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
      <LadySteps
        flow={flow}
        dispatch={dispatch}
        target={seatLabel(game, target!)}
        holder={holder}
      />
    </div>
  )
}
