import { dateKey, deriveState, formatTime, type Game } from '@avalon/record-core'
import {
  IconCards,
  IconCopy,
  IconDotsVertical,
  IconMoon,
  IconPlayerPlay,
  IconPlus,
  IconSearch,
  IconShare2,
  IconSun,
  IconTrash,
  IconUsers,
  IconX,
} from '@tabler/icons-react'
import { useState } from 'react'
import { Page, SettingsLink } from '../components/Layout.tsx'
import { Select } from '../components/Select.tsx'
import { ConfirmSheet, Sheet } from '../components/Sheet.tsx'
import { BottomBar, Button, Card, cx, EmptyState, IconButton } from '../components/ui.tsx'
import {
  EMPTY_FILTER,
  filterGames,
  isInProgress,
  type DateFilter,
  type GameFilter,
  type WinnerFilter,
} from '../games/filter.ts'
import { useGames } from '../games/store.ts'
import { useNamer } from '../naming/useDisplayName.ts'
import { navigate } from '../router.ts'
import { ScanButton } from '../share/QrScanner.tsx'
import { ShareSheet } from '../share/ShareButton.tsx'

const WINNER_OPTIONS: { value: WinnerFilter; label: string }[] = [
  { value: 'all', label: '全部勝方' },
  { value: 'good', label: '好人勝' },
  { value: 'evil', label: '壞人勝' },
  { value: 'unfinished', label: '未結束' },
]

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: '全部日期' },
  { value: 'today', label: '今天' },
  { value: '7d', label: '最近 7 天' },
  { value: '30d', label: '最近 30 天' },
]

function openGame(g: Game) {
  navigate(isInProgress(g) ? { name: 'play', id: g.id } : { name: 'game', id: g.id })
}

export function HomePage() {
  const games = useGames((s) => s.games)
  const ready = useGames((s) => s.ready)
  const remove = useGames((s) => s.remove)
  const nameOf = useNamer()
  const [filter, setFilter] = useState<GameFilter>(EMPTY_FILTER)
  const [menuFor, setMenuFor] = useState<Game | null>(null)
  const [deleting, setDeleting] = useState<Game | null>(null)
  const [sharing, setSharing] = useState<Game | null>(null)

  const inProgress = games.filter(isInProgress)
  const shown = filterGames(games, filter, nameOf)
  const filtering =
    filter !== EMPTY_FILTER && JSON.stringify(filter) !== JSON.stringify(EMPTY_FILTER)

  return (
    <Page
      title="阿瓦隆紀錄"
      actions={
        <>
          <ScanButton />
          <SettingsLink />
        </>
      }
    >
      <div className="flex-1 space-y-4 pt-2">
        {!ready && <p className="py-10 text-center text-subtext0">載入中…</p>}

        {ready && inProgress.length > 0 && (
          <section aria-label="進行中的遊戲" className="space-y-2">
            {inProgress.map((g) => {
              const s = deriveState(g)
              return (
                <button
                  key={g.id}
                  type="button"
                  aria-label={`繼續：${nameOf(g)}`}
                  onClick={() =>
                    navigate(
                      s.phase === 'finished'
                        ? { name: 'summary', id: g.id }
                        : { name: 'play', id: g.id },
                    )
                  }
                  className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-accent bg-accent/10 px-4 text-left"
                >
                  <IconPlayerPlay size={22} className="shrink-0 text-accent-fg" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{nameOf(g)}</span>
                    <span className="block text-sm text-subtext0">
                      {s.phase === 'finished'
                        ? '已結束，待結算'
                        : `進行中・任務 ${s.questIndex + 1}・成功 ${s.successes} 失敗 ${s.fails}`}
                    </span>
                  </span>
                </button>
              )
            })}
          </section>
        )}

        {ready && games.length > 0 && (
          <section aria-label="遊戲列表" className="space-y-3">
            <div className="relative">
              <IconSearch
                size={18}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-overlay1"
                aria-hidden
              />
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                aria-label="搜尋名稱或備註"
                placeholder="搜尋名稱或備註"
                className="min-h-11 w-full rounded-xl border border-overlay0 bg-base pr-11 pl-9 focus:border-accent focus:outline-none"
                value={filter.query}
                onChange={(e) => setFilter({ ...filter, query: e.target.value })}
              />
              {filter.query && (
                <IconButton
                  label="清除搜尋"
                  className="absolute top-0 right-0"
                  onClick={() => setFilter({ ...filter, query: '' })}
                >
                  <IconX size={18} />
                </IconButton>
              )}
            </div>
            <div className="flex gap-2">
              <Select
                label="依勝方篩選"
                value={filter.winner}
                options={WINNER_OPTIONS}
                onChange={(winner) => setFilter({ ...filter, winner })}
                className="flex-1 text-sm"
              />
              <Select
                label="依日期篩選"
                value={filter.date}
                options={DATE_OPTIONS}
                onChange={(date) => setFilter({ ...filter, date })}
                className="flex-1 text-sm"
              />
            </div>

            {shown.length === 0 && (
              <p className="py-6 text-center text-subtext0">沒有符合條件的遊戲</p>
            )}
            <ul className="space-y-2">
              {shown.map((g) => (
                <li key={g.id}>
                  <GameCard game={g} name={nameOf(g)} onMenu={() => setMenuFor(g)} />
                </li>
              ))}
            </ul>
            {filtering && (
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setFilter(EMPTY_FILTER)}
              >
                清除篩選
              </Button>
            )}
          </section>
        )}

        {ready && games.length === 0 && (
          <EmptyState icon={<IconCards size={48} />}>
            <p>還沒有任何遊戲紀錄</p>
            <p className="text-sm">按下方「開新局」開始記錄</p>
          </EmptyState>
        )}
      </div>

      <BottomBar>
        <Button variant="primary" className="w-full" onClick={() => navigate({ name: 'new' })}>
          <IconPlus size={20} aria-hidden />
          開新局
        </Button>
      </BottomBar>

      <Sheet
        title={menuFor ? nameOf(menuFor) : ''}
        open={menuFor !== null}
        onClose={() => setMenuFor(null)}
      >
        {menuFor && (
          <div className="space-y-2">
            <Button
              className="w-full justify-start"
              onClick={() => {
                setSharing(menuFor)
                setMenuFor(null)
              }}
            >
              <IconShare2 size={20} aria-hidden />
              分享
            </Button>
            <Button
              className="w-full justify-start"
              onClick={() => {
                const id = menuFor.id
                setMenuFor(null)
                navigate({ name: 'new', from: id })
              }}
            >
              <IconCopy size={20} aria-hidden />
              複製為新局（沿用玩家與角色配置）
            </Button>
            <Button
              className="w-full justify-start text-fail-fg"
              onClick={() => {
                setDeleting(menuFor)
                setMenuFor(null)
              }}
            >
              <IconTrash size={20} aria-hidden />
              刪除
            </Button>
          </div>
        )}
      </Sheet>
      {sharing && <ShareSheet game={sharing} open onClose={() => setSharing(null)} />}
      <ConfirmSheet
        open={deleting !== null}
        title="刪除遊戲？"
        message={deleting && `「${nameOf(deleting)}」將被永久刪除，無法復原。`}
        confirmLabel="刪除"
        danger
        onConfirm={() => deleting && void remove(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Page>
  )
}

function GameCard({ game, name, onMenu }: { game: Game; name: string; onMenu: () => void }) {
  const s = deriveState(game)
  const created = new Date(game.createdAt)
  return (
    <Card className="flex items-start gap-2 !p-0">
      <button
        type="button"
        aria-label={name}
        className="min-w-0 flex-1 p-4 text-left"
        onClick={() => openGame(game)}
      >
        <span className="block truncate font-semibold">{name}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtext0">
          <span>
            {dateKey(created)} {formatTime(created)}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <IconUsers size={14} aria-hidden />
            {game.players.length} 人
          </span>
          {s.winner ? (
            <span
              className={cx(
                'inline-flex items-center gap-0.5 font-semibold',
                s.winner === 'good' ? 'text-good-fg' : 'text-evil-fg',
              )}
            >
              {s.winner === 'good' ? (
                <IconSun size={14} aria-hidden />
              ) : (
                <IconMoon size={14} aria-hidden />
              )}
              {s.winner === 'good' ? '好人勝' : '壞人勝'}
            </span>
          ) : (
            <span>未結束</span>
          )}
        </span>
        {game.note && (
          <span className="mt-1 line-clamp-2 block text-sm text-subtext1">{game.note}</span>
        )}
      </button>
      <IconButton label={`${name} 的選項`} onClick={onMenu} className="m-1.5">
        <IconDotsVertical size={20} />
      </IconButton>
    </Card>
  )
}
