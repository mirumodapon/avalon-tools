import { deriveState, type PlayerId } from '@avalon/record-core'
import { docsHref } from '@avalon/registry'
import { AppShell } from '@avalon/ui'
import { useEffect, useState } from 'react'
import { AbandonButton } from '../play/AbandonButton.tsx'
import { Scoreboard } from '../play/Scoreboard.tsx'
import { TeamPicker } from '../play/TeamPicker.tsx'
import { useSession } from '../session/store.ts'
import type { Session } from '../session/types.ts'

/**
 * The rounds. Which screen shows follows `deriveState(game).phase`; a step that is under way
 * but not yet settled (the team being voted on) is kept in memory only.
 */
export function PlayPage({ session }: { session: Session }) {
  const { game } = session
  const setStage = useSession((s) => s.setStage)
  const state = deriveState(game)
  // The team waiting for its vote; dropped whenever a proposal is recorded.
  const [team, setTeam] = useState<{ at: number; ids: PlayerId[] } | null>(null)
  const proposals = game.rounds.reduce((n, r) => n + r.proposals.length, 0)
  const pendingTeam = team?.at === proposals ? team.ids : null

  useEffect(() => {
    if (state.phase === 'finished') setStage('finished')
  }, [state.phase, setStage])

  let body = null
  if (state.phase === 'proposal' && !pendingTeam) {
    body = <TeamPicker game={game} onSubmit={(ids) => setTeam({ at: proposals, ids })} />
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
