import { deriveState, canUndo, GameRuleError, type GameAction } from '@avalon/core'
import { IconArrowBackUp, IconChecklist } from '@tabler/icons-react'
import { useState } from 'react'
import { Page } from '../components/Layout.tsx'
import { BottomBar, Button, IconButton } from '../components/ui.tsx'
import { useGame, useGames } from '../games/store.ts'
import { AssassinationForm } from '../play/AssassinationForm.tsx'
import { FinishedPanel } from '../play/FinishedPanel.tsx'
import { ProposalForm } from '../play/ProposalForm.tsx'
import { QuestForm } from '../play/QuestForm.tsx'
import { navigate } from '../router.ts'
import { NotFoundPage } from './NotFoundPage.tsx'

export function PlayPage({ id }: { id: string }) {
  const game = useGame(id)
  const dispatchGame = useGames((s) => s.dispatch)
  const [error, setError] = useState<string | null>(null)

  if (!game) return <NotFoundPage message="找不到這場遊戲" />
  const s = deriveState(game)

  function dispatch(action: GameAction) {
    try {
      dispatchGame(id, action)
      setError(null)
    } catch (e) {
      if (e instanceof GameRuleError) setError(e.message)
      else throw e
    }
  }

  // Remount forms whenever the step changes so drafts start fresh.
  const stepKey = `${s.phase}-${s.questIndex}-${s.attempt}`

  return (
    <Page
      title={game.name.custom ?? '進行中'}
      back={{ name: 'home' }}
      actions={
        <IconButton
          label="復原上一步"
          disabled={!canUndo(game)}
          onClick={() => dispatch({ type: 'undo' })}
        >
          <IconArrowBackUp size={22} />
        </IconButton>
      }
      header={
        <p className="px-4 pb-2 text-sm text-subtext0">
          第 {s.questIndex + 1} 個任務・第 {s.attempt} 次派票・成功 {s.successes}・失敗 {s.fails}
        </p>
      }
    >
      {error && (
        <p role="alert" className="mb-3 rounded-xl border border-fail p-3 text-sm text-fail-fg">
          {error}
        </p>
      )}
      {s.phase === 'proposal' && (
        <ProposalForm
          key={stepKey}
          game={game}
          state={s}
          onSubmit={(p) => dispatch({ type: 'propose', ...p })}
        />
      )}
      {s.phase === 'quest' && (
        <QuestForm
          key={stepKey}
          game={game}
          state={s}
          onSubmit={(r) => dispatch({ type: 'recordQuest', ...r })}
        />
      )}
      {s.phase === 'assassination' && (
        <AssassinationForm
          key={stepKey}
          game={game}
          onSubmit={(a) => dispatch({ type: 'assassinate', ...a })}
        />
      )}
      {s.phase === 'finished' && (
        <div className="flex flex-1 flex-col pt-2">
          <FinishedPanel game={game} />
          <div className="flex-1" />
          <BottomBar>
            <Button variant="primary" className="w-full" onClick={() => navigate({ name: 'home' })}>
              <IconChecklist size={20} aria-hidden />
              完成
            </Button>
          </BottomBar>
        </div>
      )}
    </Page>
  )
}
