import { deriveState, type GameAction } from '@avalon/record-core'
import {
  IconChecklist,
  IconCopy,
  IconFileExport,
  IconPencil,
  IconPlayerPlay,
} from '@tabler/icons-react'
import { useState } from 'react'
import { HistoryTable } from '../components/HistoryTable.tsx'
import { Page } from '../components/Layout.tsx'
import { ProgressOverview } from '../components/ProgressOverview.tsx'
import { StatsPanel } from '../components/StatsPanel.tsx'
import { Button, Card, IconButton, SectionTitle } from '@avalon/ui'
import { ViewModeToggle } from '../components/ViewModeToggle.tsx'
import { DisplaySettingsButton } from '../components/DisplaySettings.tsx'
import { ShareButton } from '../share/ShareButton.tsx'
import { ExportSheet } from '../export/ExportSheet.tsx'
import { useGame, useGames } from '../games/store.ts'
import { useDisplayName } from '../naming/useDisplayName.ts'
import { FinishedPanel } from '../play/FinishedPanel.tsx'
import { GameSettingsSheet } from '../play/GameSettingsSheet.tsx'
import { navigate } from '../router.ts'
import { useSettings } from '../settings/store.ts'
import { NotFoundPage } from './NotFoundPage.tsx'

/** Read-mostly view of a game: history, stats, name/note and roles editing. */
export function GameDetailPage({ id }: { id: string }) {
  const game = useGame(id)
  const dispatchGame = useGames((s) => s.dispatch)
  const viewMode = useSettings((s) => s.settings.viewMode)
  // Starts from the 「瀏覽時預設隱藏角色」 setting each time; toggling here only affects this view.
  const rolesByDefault = useSettings((s) => s.settings.showRoles)
  const [showRoles, setShowRoles] = useState(rolesByDefault)
  const title = useDisplayName(game)
  const [editOpen, setEditOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!game) return <NotFoundPage message="找不到這場遊戲" />
  const s = deriveState(game)

  function dispatch(action: GameAction) {
    try {
      dispatchGame(id, action)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <Page
      title={title}
      back={{ name: 'home' }}
      actions={
        <>
          <ShareButton game={game} />
          <IconButton label="編輯名稱、備註與角色" onClick={() => setEditOpen(true)}>
            <IconPencil size={22} />
          </IconButton>
        </>
      }
      header={<ProgressOverview game={game} />}
    >
      <div className="space-y-4 pt-2">
        {error && (
          <p role="alert" className="rounded-xl border border-fail p-3 text-sm text-fail-fg">
            {error}
          </p>
        )}
        {s.phase === 'finished' ? (
          <FinishedPanel game={game}>
            {game.savedAt === null && (
              <Button
                variant="primary"
                className="mt-3"
                onClick={() => navigate({ name: 'summary', id })}
              >
                <IconChecklist size={20} aria-hidden />
                前往結算
              </Button>
            )}
          </FinishedPanel>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate({ name: 'play', id })}
          >
            <IconPlayerPlay size={20} aria-hidden />
            繼續記錄
          </Button>
        )}

        {game.note && (
          <Card>
            <SectionTitle>備註</SectionTitle>
            <p className="text-sm whitespace-pre-wrap">{game.note}</p>
          </Card>
        )}

        <section aria-label="歷史表格">
          <div className="mb-3 flex gap-2">
            <ViewModeToggle className="w-28" />
            <span className="flex-1" />
            <DisplaySettingsButton showRoles={showRoles} onShowRoles={setShowRoles} />
          </div>
          <HistoryTable game={game} viewMode={viewMode} showRoles={showRoles} />
        </section>

        <Card>
          <SectionTitle>賽後統計</SectionTitle>
          <StatsPanel game={game} showRoles={showRoles} />
        </Card>
        <Button className="w-full" onClick={() => navigate({ name: 'new', from: id })}>
          <IconCopy size={20} aria-hidden />
          複製為新局
        </Button>
        <Button className="w-full" onClick={() => setExportOpen(true)}>
          <IconFileExport size={20} aria-hidden />
          匯出這場
        </Button>
      </div>

      <ExportSheet
        game={game}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        defaultIncludeRoles={showRoles}
      />
      <GameSettingsSheet
        game={game}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        dispatch={dispatch}
      />
    </Page>
  )
}
