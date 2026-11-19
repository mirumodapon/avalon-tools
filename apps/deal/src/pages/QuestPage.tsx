import { AppShell, Button, ConfirmSheet, IconButton, cx } from '@avalon/ui'
import { IconX } from '@tabler/icons-react'
import { useCallback, useState } from 'react'
import { CardBack } from '../components/CardBack.tsx'
import { QUEST_CARD, QuestCards } from '../components/marks.tsx'
import { usePrivacyGuard } from '../hooks/usePrivacyGuard.ts'
import { cardOrder, resultText } from '../quest/quest.ts'
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
    const ok = flow.fails === 0
    return (
      <AppShell title="任務結果" onBack={close}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
          <p className={cx('text-4xl font-bold', ok ? 'text-success-fg' : 'text-fail-fg')}>
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

  if (flow.step === 'collected') {
    return (
      <AppShell title="出任務" homeHref={null} actions={stop}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
          <p className="text-center text-2xl">所有隊員已出牌</p>
          <CardBack label="長按公布結果" onReveal={() => dispatch({ type: 'show' })} />
        </div>
        {stopSheet}
      </AppShell>
    )
  }

  const nth = flow.index + 1
  return (
    <AppShell title={`出任務・第 ${nth} / ${flow.size} 位`} homeHref={null} actions={stop}>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
        {flow.step === 'handoff' ? (
          <div key={`handoff-${flow.index}`} className="flex flex-col items-center gap-6">
            <p className="text-center text-2xl">
              請將手機交給
              <strong className="mt-1 block text-accent-fg">第 {nth} 位出任務的玩家</strong>
            </p>
            <CardBack
              label="長按出牌"
              onReveal={() => dispatch({ type: 'reveal', order: cardOrder() })}
            />
          </div>
        ) : (
          <div key={`choose-${flow.index}`} className="flex w-full max-w-xs flex-col gap-4">
            <p className="text-center text-lg text-subtext1">請選擇要出的牌</p>
            {flow.order.map((card) => {
              const { label, icon: Icon } = QUEST_CARD[card]
              return (
                <button
                  key={card}
                  type="button"
                  onClick={() => dispatch({ type: 'play', card })}
                  className="no-select flex h-28 items-center justify-center gap-3 rounded-3xl border-2 border-surface2 bg-mantle text-2xl font-bold"
                >
                  <Icon size={32} aria-hidden />
                  {label}
                </button>
              )
            })}
          </div>
        )}
      </div>
      {stopSheet}
    </AppShell>
  )
}
