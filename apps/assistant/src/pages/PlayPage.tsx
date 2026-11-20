import { docsHref } from '@avalon/registry'
import { AppShell } from '@avalon/ui'
import { AbandonButton } from '../play/AbandonButton.tsx'
import type { Session } from '../session/types.ts'

/** The rounds of the game (filled in by the following tasks). */
export function PlayPage({ session }: { session: Session }) {
  return (
    <AppShell
      title={session.game.name.auto}
      homeHref={null}
      helpHref={docsHref('guide/assistant/')}
      actions={<AbandonButton />}
    >
      <div />
    </AppShell>
  )
}
