import { deriveState, dateKey, formatTime, type Game } from '@avalon/core'
import { IconDownload, IconLinkOff, IconX } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { DisplaySettingsButton } from '../components/DisplaySettings.tsx'
import { HistoryTable } from '../components/HistoryTable.tsx'
import { Page } from '../components/Layout.tsx'
import { ProgressOverview } from '../components/ProgressOverview.tsx'
import { BottomBar, Button, Card, EmptyState, Segmented } from '../components/ui.tsx'
import { ViewModeToggle } from '../components/ViewModeToggle.tsx'
import type { ConflictChoice } from '../db/repository.ts'
import { newId, useGames } from '../games/store.ts'
import { useDisplayName } from '../naming/useDisplayName.ts'
import { FinishedPanel } from '../play/FinishedPanel.tsx'
import { navigate } from '../router.ts'
import { useSettings } from '../settings/store.ts'
import { clearShareParam, decodeGame } from './link.ts'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; game: Game }

function close() {
  clearShareParam()
  navigate({ name: 'home' }, { replace: true })
}

/** Preview of a game received through a share link, with an import button. */
export function SharedGamePage({ param }: { param: string }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    decodeGame(param).then(
      (game) => alive && setState({ status: 'ready', game }),
      (e: unknown) =>
        alive && setState({ status: 'error', message: e instanceof Error ? e.message : String(e) }),
    )
    return () => {
      alive = false
    }
  }, [param])

  if (state.status === 'loading') {
    return <p className="py-20 text-center text-subtext0">讀取分享的紀錄…</p>
  }
  if (state.status === 'error') {
    return (
      <Page title="分享的紀錄">
        <EmptyState icon={<IconLinkOff size={48} />}>
          <p>無法開啟這個分享連結</p>
          <p className="text-sm">{state.message}</p>
          <Button onClick={close}>回到首頁</Button>
        </EmptyState>
      </Page>
    )
  }
  return <SharedPreview game={state.game} onClose={close} />
}

function SharedPreview({ game, onClose }: { game: Game; onClose: () => void }) {
  const title = useDisplayName(game)
  const exists = useGames((s) => s.games.some((g) => g.id === game.id))
  const importGames = useGames((s) => s.importGames)
  const viewMode = useSettings((s) => s.settings.viewMode)
  const rolesByDefault = useSettings((s) => s.settings.showRoles)
  const [showRoles, setShowRoles] = useState(rolesByDefault)
  const [choice, setChoice] = useState<ConflictChoice>('copy')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const s = deriveState(game)
  const created = new Date(game.createdAt)

  async function save() {
    setBusy(true)
    try {
      const summary = await importGames([{ game, onConflict: exists ? choice : undefined }], newId)
      clearShareParam()
      navigate({ name: 'game', id: summary.games[0]!.id }, { replace: true })
    } catch (e) {
      setError(`匯入失敗：${e instanceof Error ? e.message : String(e)}`)
      setBusy(false)
    }
  }

  return (
    <Page
      title={title}
      actions={
        <button
          type="button"
          aria-label="關閉"
          onClick={onClose}
          className="inline-flex size-11 items-center justify-center rounded-xl text-subtext1 hover:bg-surface0"
        >
          <IconX size={22} />
        </button>
      }
      header={<ProgressOverview game={game} />}
    >
      <div className="space-y-4 pt-2">
        <Card className="text-sm">
          <p className="font-semibold">別人分享給你的紀錄</p>
          <p className="text-subtext0">
            {dateKey(created)} {formatTime(created)}・{game.players.length} 人
          </p>
          {game.note && <p className="mt-2 whitespace-pre-wrap">{game.note}</p>}
        </Card>
        {s.phase === 'finished' && <FinishedPanel game={game} />}
        <section aria-label="歷史表格">
          <div className="mb-3 flex gap-2">
            <ViewModeToggle className="w-28" />
            <span className="flex-1" />
            <DisplaySettingsButton showRoles={showRoles} onShowRoles={setShowRoles} />
          </div>
          <HistoryTable game={game} viewMode={viewMode} showRoles={showRoles} />
        </section>
      </div>
      <BottomBar>
        {exists && (
          <div className="mb-2">
            <p className="mb-1 text-sm text-subtext1">本機已有這場紀錄</p>
            <Segmented
              label="已存在時"
              value={choice}
              options={[
                { value: 'overwrite', label: '覆蓋' },
                { value: 'copy', label: '另存一份' },
              ]}
              onChange={setChoice}
            />
          </div>
        )}
        {error && (
          <p role="alert" className="mb-2 text-sm text-fail-fg">
            {error}
          </p>
        )}
        <Button variant="primary" className="w-full" disabled={busy} onClick={() => void save()}>
          <IconDownload size={20} aria-hidden />
          匯入到本機
        </Button>
      </BottomBar>
    </Page>
  )
}
