import { AppShell, Button, ConfirmSheet, IconButton } from '@avalon/ui'
import { IconCircleCheck, IconConfetti, IconX } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { CardBack } from '../components/CardBack.tsx'
import { RoleCard } from '../components/RoleCard.tsx'
import { isDealing } from '../flow/machine.ts'
import { useFlow } from '../flow/store.ts'
import { navigate } from '../router.ts'

/**
 * Pass-the-phone screens, for a fresh deal or a replay of a saved one. While dealing, the back key and switching apps only turn
 * the current card face down; they never step back to an earlier card.
 */
export function DealPage({ onRedeal }: { onRedeal: () => void }) {
  const flow = useFlow((s) => s.flow)
  const dispatch = useFlow((s) => s.dispatch)
  const dealing = isDealing(flow)
  const [confirm, setConfirm] = useState<'stop' | 'redeal' | 'setup' | null>(null)

  useEffect(() => {
    if (!dealing) return
    // An extra history entry absorbs the back key while cards are being dealt.
    window.history.pushState({ deal: true }, '')
    const onPop = () => {
      window.history.pushState({ deal: true }, '')
      dispatch({ type: 'hide' })
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') dispatch({ type: 'hide' })
    }
    window.addEventListener('popstate', onPop)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [dealing, dispatch])

  const leave = (to: 'setup' | 'history') => {
    dispatch({ type: 'reset' })
    navigate({ name: to })
  }
  const toSetup = () => leave('setup')
  const toHistory = () => leave('history')

  if (flow.step === 'idle') return null

  if (flow.step === 'done' && flow.mode === 'replay') {
    return (
      <AppShell title="回放完成">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
          <IconCircleCheck size={64} className="text-accent-fg" aria-hidden />
          <p className="text-2xl font-bold">所有玩家已重新查看身分</p>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <Button variant="primary" onClick={toHistory}>
              回到歷史紀錄
            </Button>
            <Button onClick={toSetup}>回到設定</Button>
          </div>
        </div>
      </AppShell>
    )
  }

  if (flow.step === 'done') {
    return (
      <AppShell title="發牌完成">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
          <IconConfetti size={64} className="text-accent-fg" aria-hidden />
          <p className="text-2xl font-bold">所有玩家已確認身分，遊戲開始！</p>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <Button variant="primary" onClick={() => setConfirm('redeal')}>
              重新發牌
            </Button>
            <Button onClick={() => setConfirm('setup')}>回到設定</Button>
            <Button variant="ghost" onClick={toHistory}>
              查看歷史紀錄
            </Button>
          </div>
        </div>
        <ConfirmSheet
          open={confirm === 'redeal'}
          title="重新發牌？"
          message="將用相同設定重新分配所有角色，大家需要重新查看身分。這一局的結果仍保存在歷史紀錄。"
          confirmLabel="重新發牌"
          onConfirm={onRedeal}
          onClose={() => setConfirm(null)}
        />
        <ConfirmSheet
          open={confirm === 'setup'}
          title="回到設定？"
          message="這一局的結果仍保存在歷史紀錄。"
          confirmLabel="回到設定"
          onConfirm={toSetup}
          onClose={() => setConfirm(null)}
        />
      </AppShell>
    )
  }

  const self = flow.table[flow.index]!
  const total = flow.table.length
  const replay = flow.mode === 'replay'
  return (
    <AppShell
      title={`${replay ? '回放・' : ''}第 ${flow.index + 1} / ${total} 位`}
      homeHref={null}
      actions={
        <IconButton label={replay ? '結束回放' : '結束發牌'} onClick={() => setConfirm('stop')}>
          <IconX size={22} />
        </IconButton>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
        {flow.step === 'handoff' ? (
          // key: a fresh card for every player, nothing carried over.
          <div key={`handoff-${flow.index}`} className="flex flex-col items-center gap-6">
            <p className="text-center text-2xl">
              請將手機交給 <strong className="text-accent-fg">{self.seat} 號玩家</strong>
            </p>
            <CardBack onReveal={() => dispatch({ type: 'reveal' })} />
          </div>
        ) : (
          <RoleCard
            key={`reveal-${flow.index}`}
            self={self}
            table={flow.table}
            onCover={() => dispatch({ type: 'confirm' })}
          />
        )}
      </div>
      <ConfirmSheet
        open={confirm === 'stop'}
        title={replay ? '結束回放？' : '結束發牌？'}
        message={
          replay ? '隨時可以從歷史紀錄再次回放。' : '還有玩家沒看過身分。結果已保存在歷史紀錄。'
        }
        confirmLabel={replay ? '結束回放' : '結束發牌'}
        danger={!replay}
        onConfirm={replay ? toHistory : toSetup}
        onClose={() => setConfirm(null)}
      />
    </AppShell>
  )
}
