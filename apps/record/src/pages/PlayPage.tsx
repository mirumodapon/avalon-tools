import { deriveState, canUndo, GameRuleError, type GameAction } from '@avalon/record-core'
import {
  IconArrowBackUp,
  IconChecklist,
  IconPencil,
  IconSettings,
  IconTable,
} from '@tabler/icons-react'
import { useState } from 'react'
import { HistoryTable } from '../components/HistoryTable.tsx'
import { Page } from '../components/Layout.tsx'
import { ProgressOverview } from '../components/ProgressOverview.tsx'
import { BottomBar, Button, IconButton } from '@avalon/ui'
import { ViewModeToggle } from '../components/ViewModeToggle.tsx'
import { DisplaySettingsButton } from '../components/DisplaySettings.tsx'
import { useGame, useGames } from '../games/store.ts'
import { AssassinationForm } from '../play/AssassinationForm.tsx'
import { FinishedPanel } from '../play/FinishedPanel.tsx'
import { ProposalForm } from '../play/ProposalForm.tsx'
import { useDisplayName } from '../naming/useDisplayName.ts'
import { LadyForm } from '../lady/LadyForm.tsx'
import { GameSettingsSheet } from '../play/GameSettingsSheet.tsx'
import { UndoConfirm } from '../play/UndoConfirm.tsx'
import { QuestForm } from '../play/QuestForm.tsx'
import { navigate } from '../router.ts'
import { useSettings } from '../settings/store.ts'
import { usePersistentState } from '../session/usePersistentState.ts'
import { NotFoundPage } from './NotFoundPage.tsx'

export function PlayPage({ id }: { id: string }) {
  const game = useGame(id)
  const dispatchGame = useGames((s) => s.dispatch)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = usePersistentState<'record' | 'history'>('play-tab', id, 'record')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [undoOpen, setUndoOpen] = useState(false)
  const title = useDisplayName(game)
  // In-progress games always start with roles hidden, regardless of the global setting.
  const [showRoles, setShowRoles] = useState(false)
  const viewMode = useSettings((st) => st.settings.viewMode)
  const updateSettings = useSettings((st) => st.update)

  if (!game) return <NotFoundPage message="找不到這場遊戲" />
  const s = deriveState(game)

  /** Applies an action; returns false (and shows the error) when the rules reject it. */
  function dispatch(action: GameAction): boolean {
    try {
      dispatchGame(id, action)
      setError(null)
      return true
    } catch (e) {
      if (e instanceof GameRuleError) {
        setError(e.message)
        return false
      }
      throw e
    }
  }

  // Remount forms whenever the step changes so drafts start fresh.
  const stepKey = `${s.phase}-${s.questIndex}-${s.attempt}`

  return (
    <Page
      title={title}
      back={{ name: 'home' }}
      actions={
        <>
          <IconButton
            label={tab === 'history' ? '回到記錄' : '歷史表格'}
            aria-pressed={tab === 'history'}
            onClick={() => setTab(tab === 'history' ? 'record' : 'history')}
            className={tab === 'history' ? 'bg-accent/20 text-accent-fg!' : ''}
          >
            {tab === 'history' ? <IconPencil size={22} /> : <IconTable size={22} />}
          </IconButton>
          <IconButton label="遊戲設定" onClick={() => setSettingsOpen(true)}>
            <IconSettings size={22} />
          </IconButton>
          <IconButton
            label="復原上一步"
            disabled={!canUndo(game)}
            onClick={() => setUndoOpen(true)}
          >
            <IconArrowBackUp size={22} />
          </IconButton>
        </>
      }
      header={<ProgressOverview game={game} />}
    >
      {tab === 'history' ? (
        <div className="pt-2">
          <div className="mb-3 flex gap-2">
            <ViewModeToggle className="w-28" />
            <span className="flex-1" />
            <DisplaySettingsButton showRoles={showRoles} onShowRoles={setShowRoles} />
          </div>
          <HistoryTable game={game} viewMode={viewMode} showRoles={showRoles} />
        </div>
      ) : (
        <>
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
              onSubmit={(p) => {
                if (dispatch({ type: 'propose', ...p }))
                  updateSettings({ defaultInputMode: p.inputMode })
              }}
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
          {s.phase === 'lady' && (
            <LadyForm
              key={stepKey}
              game={game}
              state={s}
              onUse={(u) => dispatch({ type: 'useLady', ...u })}
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
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate({ name: 'summary', id })}
                >
                  <IconChecklist size={20} aria-hidden />
                  前往結算
                </Button>
              </BottomBar>
            </div>
          )}
        </>
      )}
      <GameSettingsSheet
        game={game}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        dispatch={dispatch}
      />
      <UndoConfirm
        game={game}
        open={undoOpen}
        onConfirm={() => dispatch({ type: 'undo' })}
        onClose={() => setUndoOpen(false)}
      />
    </Page>
  )
}
