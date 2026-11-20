import { deriveState, type InputMode, type Votes } from '@avalon/record-core'
import { docsHref } from '@avalon/registry'
import { AppShell } from '@avalon/ui'
import { useEffect } from 'react'
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
 * The rounds. Which screen shows follows `deriveState(game).phase`; the step under way but
 * not yet recorded (team, votes, quest cards, the Lady's look) is saved as the session's
 * progress, so leaving and coming back lands on the same step.
 */
export function PlayPage({ session }: { session: Session }) {
  const { game } = session
  const setStage = useSession((s) => s.setStage)
  const apply = useSession((s) => s.apply)
  const state = deriveState(game)
  const setProgress = useSession((s) => s.setProgress)
  const progress = session.progress
  useEffect(() => {
    if (state.phase === 'finished') setStage('finished')
  }, [state.phase, setStage])

  let body = null
  if (state.phase === 'proposal') {
    if (progress?.kind === 'voted') {
      const { team, votes, inputMode } = progress
      body = (
        <VoteResult
          game={game}
          votes={votes}
          onContinue={() => apply({ type: 'propose', team, votes, inputMode })}
        />
      )
    } else if (progress?.kind === 'team') {
      const { team } = progress
      const done = (votes: Votes, inputMode: InputMode = 'approvals') =>
        setProgress({ kind: 'voted', team, votes, inputMode })
      body =
        session.voteMode === 'pass' ? (
          <PassVote
            game={game}
            leaderId={state.leaderId}
            cast={progress.cast}
            onCast={(cast) => setProgress({ kind: 'team', team, cast })}
            onDone={done}
          />
        ) : (
          <LeaderVote game={game} team={team} onDone={done} />
        )
    } else {
      body = (
        <TeamPicker
          game={game}
          onSubmit={(team) => setProgress({ kind: 'team', team, cast: [] })}
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
        progress={progress?.kind === 'quest' ? progress : null}
        onProgress={(played, revealed) => setProgress({ kind: 'quest', played, revealed })}
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
        progress={progress?.kind === 'lady' ? progress : null}
        onProgress={(target, seen) => setProgress({ kind: 'lady', target, seen })}
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
