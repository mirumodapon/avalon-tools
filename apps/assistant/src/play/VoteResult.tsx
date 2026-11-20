import { VOTE_MARK } from '@avalon/pass-play'
import type { Game, Votes } from '@avalon/record-core'
import { countApprovals, isMajority } from '@avalon/rules'
import { BottomBar, Button, cx } from '@avalon/ui'
import { seatLabel } from '../seat.ts'

/** Everyone's vote, in seat order, and whether the team goes; 繼續 records it. */
export function VoteResult({
  game,
  votes,
  onContinue,
}: {
  game: Game
  votes: Votes
  onContinue: () => void
}) {
  const approved = isMajority(countApprovals(votes), game.players.length)
  return (
    <>
      <p
        className={cx(
          'text-center text-4xl font-bold',
          approved ? 'text-approve-fg' : 'text-reject-fg',
        )}
      >
        {approved ? '通過' : '否決'}
      </p>
      <ul className="grid grid-cols-2 gap-2">
        {game.players.map((p) => {
          const { label, icon: Icon, text } = VOTE_MARK[votes[p.id] ?? 'reject']
          return (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl bg-mantle px-3 py-2"
            >
              <span>{seatLabel(game, p.id)}</span>
              <span className={cx('inline-flex items-center gap-1 font-bold', text)}>
                <Icon size={18} aria-hidden />
                {label}
              </span>
            </li>
          )
        })}
      </ul>
      <BottomBar>
        <Button variant="primary" className="w-full" onClick={onContinue}>
          繼續
        </Button>
      </BottomBar>
    </>
  )
}
