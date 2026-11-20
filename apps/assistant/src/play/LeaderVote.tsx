import { votesFromApprovals, type Game, type PlayerId, type Votes } from '@avalon/record-core'
import { BottomBar, Button, ConfirmSheet } from '@avalon/ui'
import { useState } from 'react'
import { seatLabel } from '../seat.ts'
import { SeatGrid } from './SeatGrid.tsx'

/** 隊長輸入: everyone votes in the open and the leader taps who approved. */
export function LeaderVote({ game, onDone }: { game: Game; onDone: (votes: Votes) => void }) {
  const [approvers, setApprovers] = useState<PlayerId[]>([])
  const [confirming, setConfirming] = useState(false)
  const ids = game.players.map((p) => p.id)
  const toggle = (id: PlayerId) =>
    setApprovers(approvers.includes(id) ? approvers.filter((x) => x !== id) : [...approvers, id])
  const ordered = ids.filter((id) => approvers.includes(id))

  return (
    <>
      <p className="text-lg font-bold">點選投同意的玩家</p>
      <SeatGrid game={game} selected={approvers} onToggle={toggle} />
      <BottomBar>
        <Button variant="primary" className="w-full" onClick={() => setConfirming(true)}>
          送出投票
        </Button>
      </BottomBar>
      <ConfirmSheet
        open={confirming}
        title="送出投票？"
        message={
          ordered.length
            ? `同意：${ordered.map((id) => seatLabel(game, id)).join('、')}`
            : '所有人都投反對。'
        }
        confirmLabel="確定"
        onConfirm={() => {
          setConfirming(false)
          onDone(votesFromApprovals(ids, approvers))
        }}
        onClose={() => setConfirming(false)}
      />
    </>
  )
}
