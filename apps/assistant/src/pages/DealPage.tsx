import { DealSteps, flowReducer, IDLE, isDealing, usePrivacyGuard } from '@avalon/pass-play'
import { docsHref } from '@avalon/registry'
import type { RoleId, SeatRole } from '@avalon/rules'
import { AppShell } from '@avalon/ui'
import { useCallback, useEffect, useReducer } from 'react'
import { AbandonButton } from '../play/AbandonButton.tsx'
import { seatLabel } from '../seat.ts'
import type { Session } from '../session/types.ts'
import { useSession } from '../session/store.ts'

function seatTable(session: Session): SeatRole[] {
  return session.game.players.map((p, i) => ({
    seat: i + 1,
    role: session.game.roleAssignment[p.id] as RoleId,
  }))
}

/**
 * 發角色: the phone goes round every seat. The current card lives only in memory, so a
 * reload starts again from seat 1.
 */
export function DealPage({ session }: { session: Session }) {
  const setStage = useSession((s) => s.setStage)
  const [flow, dispatch] = useReducer(flowReducer, IDLE)
  const hide = useCallback(() => dispatch({ type: 'hide' }), [])
  usePrivacyGuard(isDealing(flow), hide)

  useEffect(() => {
    if (flow.step === 'idle')
      dispatch({
        type: 'start',
        mode: 'deal',
        recordId: session.game.id,
        table: seatTable(session),
      })
    if (flow.step === 'done') setStage('play')
  }, [flow.step, session, setStage])

  if (!isDealing(flow)) return null
  return (
    <AppShell
      title={`發角色・第 ${flow.index + 1} / ${flow.table.length} 位`}
      homeHref={null}
      helpHref={docsHref('guide/assistant/')}
      actions={<AbandonButton />}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
        <DealSteps
          flow={flow}
          dispatch={dispatch}
          who={(i) => seatLabel(session.game, session.game.players[i]!.id)}
        />
      </div>
    </AppShell>
  )
}
