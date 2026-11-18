import { deriveState, canUndo, GameRuleError, type GameAction } from '@avalon/core'
import { IconArrowBackUp, IconChecklist, IconMasksTheater } from '@tabler/icons-react'
import { useState } from 'react'
import { HistoryTable } from '../components/HistoryTable.tsx'
import { Page } from '../components/Layout.tsx'
import { ProgressOverview } from '../components/ProgressOverview.tsx'
import { BottomBar, Button, IconButton, Segmented } from '../components/ui.tsx'
import { ViewModeToggle } from '../components/ViewModeToggle.tsx'
import { useGame, useGames } from '../games/store.ts'
import { AssassinationForm } from '../play/AssassinationForm.tsx'
import { FinishedPanel } from '../play/FinishedPanel.tsx'
import { ProposalForm } from '../play/ProposalForm.tsx'
import { LadyEditSheet } from '../lady/LadyEditSheet.tsx'
import { LadyForm } from '../lady/LadyForm.tsx'
import { QuestForm } from '../play/QuestForm.tsx'
import { RolesSheet } from '../roles/RolesSheet.tsx'
import { ShowRolesButton } from '../roles/ShowRolesToggle.tsx'
import { navigate } from '../router.ts'
import { useSettings } from '../settings/store.ts'
import { NotFoundPage } from './NotFoundPage.tsx'

export function PlayPage({ id }: { id: string }) {
  const game = useGame(id)
  const dispatchGame = useGames((s) => s.dispatch)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'record' | 'history'>('record')
  const [rolesOpen, setRolesOpen] = useState(false)
  const [editingLady, setEditingLady] = useState<number | null>(null)
  // In-progress games always start with roles hidden, regardless of the global setting.
  const [showRoles, setShowRoles] = useState(false)
  const viewMode = useSettings((st) => st.settings.viewMode)

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
        <>
          <IconButton label="角色" onClick={() => setRolesOpen(true)}>
            <IconMasksTheater size={22} />
          </IconButton>
          <IconButton
            label="復原上一步"
            disabled={!canUndo(game)}
            onClick={() => dispatch({ type: 'undo' })}
          >
            <IconArrowBackUp size={22} />
          </IconButton>
        </>
      }
      header={
        <>
          <ProgressOverview game={game} />
          <div className="px-4 pb-2">
            <Segmented
              label="頁籤"
              value={tab}
              options={[
                { value: 'record', label: '記錄' },
                { value: 'history', label: '歷史表格' },
              ]}
              onChange={setTab}
            />
          </div>
        </>
      }
    >
      {tab === 'history' ? (
        <div className="pt-2">
          <div className="mb-3 flex gap-2">
            <ViewModeToggle className="flex-1" />
            <ShowRolesButton checked={showRoles} onChange={setShowRoles} />
          </div>
          <HistoryTable
            game={game}
            viewMode={viewMode}
            showRoles={showRoles}
            onEditLady={setEditingLady}
          />
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
          {s.phase === 'lady' && (
            <LadyForm
              key={stepKey}
              game={game}
              state={s}
              onUse={(u) => dispatch({ type: 'useLady', ...u })}
              onSkip={(u) => dispatch({ type: 'skipLady', ...u })}
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
                  onClick={() => navigate({ name: 'home' })}
                >
                  <IconChecklist size={20} aria-hidden />
                  完成
                </Button>
              </BottomBar>
            </div>
          )}
        </>
      )}
      <RolesSheet
        game={game}
        open={rolesOpen}
        onClose={() => setRolesOpen(false)}
        dispatch={dispatch}
      />
      <LadyEditSheet
        game={game}
        index={editingLady}
        onClose={() => setEditingLady(null)}
        dispatch={dispatch}
      />
    </Page>
  )
}
