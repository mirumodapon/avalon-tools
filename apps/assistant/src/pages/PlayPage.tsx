import { deriveState, type InputMode, type PlayerId, type Votes } from '@avalon/record-core'
import { docsHref } from '@avalon/registry'
import { AppShell } from '@avalon/ui'
import { useEffect, useState } from 'react'
import { AbandonButton } from '../play/AbandonButton.tsx'
import { Assassinate } from '../play/Assassinate.tsx'
import { LadyRun } from '../play/LadyRun.tsx'
import { LeaderVote } from '../play/LeaderVote.tsx'
import { PassVote } from '../play/PassVote.tsx'
import { QuestRun } from '../play/QuestRun.tsx'
import { Scoreboard } from '../play/Scoreboard.tsx'
import { TeamPicker } from '../play/TeamPicker.tsx'
import { VoteResult } from '../play/VoteResult.tsx'
import { useSession } from '../session/store.ts'
import type { Session } from '../session/types.ts'

/**
 * The rounds. Which screen shows follows `deriveState(game).phase`; a step that is under way
 * but not yet settled (the team being voted on) is kept in memory only.
 */
export function PlayPage({ session }: { session: Session }) {
  const { game } = session
  const setStage = useSession((s) => s.setStage)
  const apply = useSession((s) => s.apply)
  const state = deriveState(game)
  // The team and votes not yet recorded, tagged with the proposal count they belong to so
  // they are dropped once anything is recorded.
  const proposals = game.rounds.reduce((n, r) => n + r.proposals.length, 0)
  const [pending, setPending] = useState<{
    at: number
    team: PlayerId[]
    votes?: Votes
    inputMode?: InputMode
  } | null>(null)
  const current = pending?.at === proposals ? pending : null

  useEffect(() => {
    if (state.phase === 'finished') setStage('finished')
  }, [state.phase, setStage])

  let body = null
  if (state.phase === 'proposal') {
    if (!current) {
      body = <TeamPicker game={game} onSubmit={(team) => setPending({ at: proposals, team })} />
    } else if (!current.votes) {
      const done = (votes: Votes, inputMode: InputMode = 'approvals') =>
        setPending({ ...current, votes, inputMode })
      body =
        session.voteMode === 'pass' ? (
          <PassVote game={game} leaderId={state.leaderId} onDone={done} />
        ) : (
          <LeaderVote game={game} team={current.team} onDone={done} />
        )
    } else {
      const { team, votes, inputMode = 'approvals' } = current
      body = (
        <VoteResult
          game={game}
          votes={votes}
          onContinue={() => apply({ type: 'propose', team, votes, inputMode })}
        />
      )
    }
  }

  if (state.phase === 'quest') {
    const round = game.rounds[state.questIndex]!
    const approved = round.proposals.at(-1)!
    body = (
      <QuestRun
        // A fresh quest whenever the approved proposal changes.
        key={approved.id}
        game={game}
        team={approved.team}
        onDone={(failCount) => apply({ type: 'recordQuest', failCount })}
      />
    )
  }

  if (state.phase === 'lady' && state.ladyHolderId) {
    body = (
      <LadyRun
        key={game.lady?.uses.length ?? 0}
        game={game}
        holderId={state.ladyHolderId}
        onDone={(targetId, declared) => apply({ type: 'useLady', targetId, declared })}
      />
    )
  }

  if (state.phase === 'assassination') {
    body = (
      <Assassinate
        game={game}
        onDone={(targetId) => apply({ type: 'assassinate', targetId, manualHit: null })}
      />
    )
  }

  return (
    <AppShell
      title={game.name.auto}
      homeHref={null}
      helpHref={docsHref('guide/assistant/')}
      actions={<AbandonButton />}
    >
      <div className="flex flex-1 flex-col gap-4 pt-2 pb-24">
        <Scoreboard game={game} />
        {body}
      </div>
    </AppShell>
  )
}
