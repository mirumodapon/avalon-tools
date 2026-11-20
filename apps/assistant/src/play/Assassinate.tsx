import { playerFaction, type Game, type PlayerId } from '@avalon/record-core'
import { BottomBar, Button, ConfirmSheet } from '@avalon/ui'
import { useState } from 'react'
import { seatLabel } from '../seat.ts'
import { SeatGrid } from './SeatGrid.tsx'

/**
 * 刺客指認, in public: the assassin picks a good player (evil teammates, the assassin
 * included, can't be picked), and the choice is confirmed before it settles the game.
 */
export function Assassinate({
  game,
  onDone,
}: {
  game: Game
  onDone: (targetId: PlayerId) => void
}) {
  const [target, setTarget] = useState<PlayerId | null>(null)
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      <p className="text-lg font-bold">刺客指認</p>
      <p className="text-subtext1">好人完成三次任務。刺客選擇要刺殺的玩家：</p>
      <SeatGrid
        game={game}
        selected={target ? [target] : []}
        onToggle={(id) => setTarget(id === target ? null : id)}
        disabled={(id) => (playerFaction(game, id) === 'evil' ? '壞人隊友' : null)}
      />
      <BottomBar>
        <Button
          variant="primary"
          className="w-full"
          disabled={!target}
          onClick={() => setConfirming(true)}
        >
          刺殺
        </Button>
      </BottomBar>
      <ConfirmSheet
        open={confirming}
        title="確定刺殺？"
        message={target ? `刺殺 ${seatLabel(game, target)}，結果將立即公布。` : ''}
        confirmLabel="確定"
        onConfirm={() => {
          setConfirming(false)
          if (target) onDone(target)
        }}
        onClose={() => setConfirming(false)}
      />
    </>
  )
}
