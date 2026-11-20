import { AppShell, Button, ConfirmSheet, IconButton, cx } from '@avalon/ui'
import { IconX } from '@tabler/icons-react'
import { useCallback, useState } from 'react'
import {
  QuestCards,
  QuestSteps,
  questResultText,
  resultText,
  usePrivacyGuard,
} from '@avalon/pass-play'
import { useQuest } from '../quest/store.ts'

/** A quest in progress: each member plays a card in private, then the result. */
export function QuestPage() {
  const flow = useQuest((s) => s.flow)
  const dispatch = useQuest((s) => s.dispatch)
  const [confirmStop, setConfirmStop] = useState(false)
  const voting = flow.step === 'handoff' || flow.step === 'choose' || flow.step === 'collected'
  const hide = useCallback(() => dispatch({ type: 'hide' }), [dispatch])
  usePrivacyGuard(voting, hide)

  if (flow.step === 'setup') return null
  const close = () => dispatch({ type: 'reset' })

  if (flow.step === 'result') {
    return (
      <AppShell title="任務結果" onBack={close}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
          <p className={cx('text-4xl font-bold', questResultText(flow.fails))}>
            {resultText(flow.fails)}
          </p>
          <QuestCards size={flow.size} fails={flow.fails} />
          <div className="flex w-full max-w-xs flex-col gap-3">
            <Button variant="primary" onClick={() => dispatch({ type: 'start', size: flow.size })}>
              再出一次任務
            </Button>
            <Button onClick={close}>回到設定</Button>
          </div>
        </div>
      </AppShell>
    )
  }

  const stop = (
    <IconButton label="結束出任務" onClick={() => setConfirmStop(true)}>
      <IconX size={22} />
    </IconButton>
  )
  const stopSheet = (
    <ConfirmSheet
      open={confirmStop}
      title="結束出任務？"
      message="已出的牌不會保留，需要重新出任務。"
      confirmLabel="結束"
      danger
      onConfirm={close}
      onClose={() => setConfirmStop(false)}
    />
  )

  const title =
    flow.step === 'collected' ? '出任務' : `出任務・第 ${flow.index + 1} / ${flow.size} 位`
  return (
    <AppShell title={title} homeHref={null} actions={stop}>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
        <QuestSteps flow={flow} dispatch={dispatch} who={(i) => `第 ${i + 1} 位出任務的玩家`} />
      </div>
      {stopSheet}
    </AppShell>
  )
}
