import {
  createGame,
  defaultPlayerNames,
  factionCounts,
  makePlayers,
  PLAYER_COUNTS,
  teamSizes,
  type PlayerCount,
} from '@avalon/core'
import {
  IconArrowDown,
  IconArrowUp,
  IconCrown,
  IconHistory,
  IconPlayerPlay,
  IconRefresh,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { Page, SettingsLink } from '../components/Layout.tsx'
import {
  BottomBar,
  Button,
  Card,
  cx,
  IconButton,
  SectionTitle,
  Segmented,
  TextField,
} from '../components/ui.tsx'
import { newId, useGames } from '../games/store.ts'
import { navigate } from '../router.ts'

function resize(names: string[], count: number): string[] {
  return defaultPlayerNames(count).map((d, i) => names[i] ?? d)
}

export function SetupPage() {
  const games = useGames((s) => s.games)
  const add = useGames((s) => s.add)
  const recent = games[0]

  const [count, setCount] = useState<PlayerCount>(5)
  const [names, setNames] = useState<string[]>(() => defaultPlayerNames(5))
  const [leader, setLeader] = useState(0)
  const [customName, setCustomName] = useState('')

  const sizes = teamSizes(count)
  const factions = factionCounts(count)

  const duplicate = useMemo(() => {
    const trimmed = names.map((n) => n.trim()).filter(Boolean)
    return trimmed.length !== new Set(trimmed).size
  }, [names])

  function changeCount(n: PlayerCount) {
    setCount(n)
    setNames((prev) => resize(prev, n))
    setLeader((l) => (l < n ? l : 0))
  }

  function move(i: number, delta: number) {
    const j = i + delta
    if (j < 0 || j >= names.length) return
    setNames((prev) => {
      const next = [...prev]
      ;[next[i], next[j]] = [next[j]!, next[i]!]
      return next
    })
    if (leader === i) setLeader(j)
    else if (leader === j) setLeader(i)
  }

  function loadRecent() {
    if (!recent) return
    setCount(recent.players.length as PlayerCount)
    setNames(recent.players.map((p) => p.name))
    setLeader(0)
  }

  function start() {
    const players = makePlayers(names)
    const game = createGame({
      id: newId(),
      now: new Date().toISOString(),
      players,
      firstLeaderId: players[leader]!.id,
      name: { custom: customName },
    })
    add(game)
    navigate({ name: 'play', id: game.id }, { replace: true })
  }

  return (
    <Page title="開新局" back={{ name: 'home' }} actions={<SettingsLink />}>
      <div className="space-y-4">
        <Card>
          <TextField
            label="遊戲名稱（可留空）"
            value={customName}
            onChange={setCustomName}
            placeholder="留空將依命名規則自動命名"
            maxLength={60}
          />
        </Card>

        <Card>
          <SectionTitle>人數</SectionTitle>
          <Segmented
            label="人數"
            value={String(count)}
            options={PLAYER_COUNTS.map((n) => ({ value: String(n), label: `${n}` }))}
            onChange={(v) => changeCount(Number(v) as PlayerCount)}
          />
          <p className="mt-2 text-sm text-subtext0">
            好人 {factions.good}・壞人 {factions.evil}・出隊人數 {sizes.join(' / ')}
            {count >= 7 && '（第 4 局需 2 張失敗）'}
          </p>
        </Card>

        <Card>
          <SectionTitle
            action={
              <div className="flex gap-1">
                {recent && (
                  <Button variant="ghost" className="min-h-9 px-2 text-sm" onClick={loadRecent}>
                    <IconHistory size={16} aria-hidden />
                    帶入最近玩家
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="min-h-9 px-2 text-sm"
                  onClick={() => setNames(defaultPlayerNames(count))}
                >
                  <IconRefresh size={16} aria-hidden />
                  預設
                </Button>
              </div>
            }
          >
            玩家（依座位順時針）
          </SectionTitle>
          <ol className="space-y-2">
            {names.map((name, i) => (
              <li key={i} className="flex items-center gap-1">
                <span className="w-6 shrink-0 text-center text-sm text-subtext0">{i + 1}</span>
                <input
                  aria-label={`第 ${i + 1} 位玩家名稱`}
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-overlay0 bg-base px-3 focus:border-accent focus:outline-none"
                  value={name}
                  placeholder={`${i + 1}號`}
                  maxLength={20}
                  onChange={(e) =>
                    setNames((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))
                  }
                />
                <IconButton
                  label={leader === i ? '第一位隊長' : '設為第一位隊長'}
                  aria-pressed={leader === i}
                  onClick={() => setLeader(i)}
                  className={cx(leader === i ? 'text-crown-fg' : 'text-overlay0')}
                >
                  <IconCrown size={22} />
                </IconButton>
                <IconButton
                  label="往上移"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="w-8"
                >
                  <IconArrowUp size={18} />
                </IconButton>
                <IconButton
                  label="往下移"
                  disabled={i === names.length - 1}
                  onClick={() => move(i, 1)}
                  className="w-8"
                >
                  <IconArrowDown size={18} />
                </IconButton>
              </li>
            ))}
          </ol>
          {duplicate && (
            <p className="mt-2 text-sm text-fail-fg">玩家名稱重複，記錄時可能難以分辨</p>
          )}
          <p className="mt-2 flex items-center gap-1 text-sm text-subtext0">
            <IconCrown size={16} className="text-crown-fg" aria-hidden />
            第一位隊長：{names[leader]?.trim() || `${leader + 1}號`}
          </p>
        </Card>
      </div>

      <BottomBar>
        <Button variant="primary" className="w-full" onClick={start}>
          <IconPlayerPlay size={20} aria-hidden />
          開始遊戲
        </Button>
      </BottomBar>
    </Page>
  )
}
