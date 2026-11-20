import { AppShell, Button, ConfirmSheet, IconButton } from '@avalon/ui'
import { IconRipple, IconX } from '@tabler/icons-react'
import { useCallback, useState } from 'react'
import { LadySteps, usePrivacyGuard } from '@avalon/pass-play'
import { useLady } from '../lady/store.ts'

/** A Lady of the Lake use in progress: the inspected player chooses, the holder looks. */
export function LadyPage() {
  const flow = useLady((s) => s.flow)
  const dispatch = useLady((s) => s.dispatch)
  const [confirmStop, setConfirmStop] = useState(false)
  const active =
    flow.step === 'toTarget' ||
    flow.step === 'declare' ||
    flow.step === 'toHolder' ||
    flow.step === 'reveal'
  const hide = useCallback(() => dispatch({ type: 'hide' }), [dispatch])
  usePrivacyGuard(active, hide)

  if (flow.step === 'idle') return null
  const close = () => dispatch({ type: 'close' })

  if (flow.step === 'passed') {
    return (
      <AppShell title="湖中女神" onBack={close}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
          <IconRipple size={64} className="text-lady-fg" aria-hidden />
          <p className="text-2xl font-bold">湖中女神交給被查驗的玩家</p>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <Button variant="primary" onClick={() => dispatch({ type: 'start' })}>
              再查驗一次
            </Button>
            <Button onClick={close}>回到設定</Button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="湖中女神"
      homeHref={null}
      actions={
        <IconButton label="結束這次查驗" onClick={() => setConfirmStop(true)}>
          <IconX size={22} />
        </IconButton>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
        <LadySteps flow={flow} dispatch={dispatch} target="被查驗的玩家" holder="湖中女神持有者" />
      </div>
      <ConfirmSheet
        open={confirmStop}
        title="結束這次查驗？"
        message="這次的選擇不會保留。"
        confirmLabel="結束"
        danger
        onConfirm={close}
        onClose={() => setConfirmStop(false)}
      />
    </AppShell>
  )
}
