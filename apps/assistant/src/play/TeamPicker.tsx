import { deriveState, type Game, type PlayerId } from '@avalon/record-core'
import { BottomBar, Button, ConfirmSheet } from '@avalon/ui'
import { useState } from 'react'
import { seatLabel } from '../seat.ts'
import { SeatGrid } from './SeatGrid.tsx'

/** The leader taps the team; a full team is confirmed before the vote. */
export function TeamPicker({
  game,
  onSubmit,
}: {
  game: Game
  onSubmit: (team: PlayerId[]) => void
}) {
  const { leaderId, teamSize } = deriveState(game)
  const [team, setTeam] = useState<PlayerId[]>([])
  const [confirming, setConfirming] = useState(false)
  // In seat order, whatever order they were tapped in.
  const ordered = game.players.map((p) => p.id).filter((id) => team.includes(id))

  function toggle(id: PlayerId) {
    if (team.includes(id)) setTeam(team.filter((x) => x !== id))
    else if (team.length < teamSize) setTeam([...team, id])
  }

  return (
    <>
      <div className="flex items-baseline justify-between">
        <p className="text-lg font-bold">隊長：{seatLabel(game, leaderId)}</p>
        <p className="text-subtext1">需要 {teamSize} 人</p>
      </div>
      <SeatGrid game={game} selected={team} onToggle={toggle} />
      <BottomBar>
        <Button
          variant="primary"
          className="w-full"
          disabled={team.length !== teamSize}
          onClick={() => setConfirming(true)}
        >
          送出組隊
        </Button>
      </BottomBar>
      <ConfirmSheet
        open={confirming}
        title="送出組隊？"
        message={ordered.map((id) => seatLabel(game, id)).join('、')}
        confirmLabel="確定"
        onConfirm={() => {
          setConfirming(false)
          onSubmit(ordered)
        }}
        onClose={() => setConfirming(false)}
      />
    </>
  )
}
