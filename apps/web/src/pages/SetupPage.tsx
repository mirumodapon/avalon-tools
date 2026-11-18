import {
  createGame,
  defaultRoleConfig,
  factionCounts,
  makePlayers,
  PLAYER_COUNTS,
  teamSizes,
  validateAssignment,
  validateRoleConfig,
  type PlayerCount,
  type RoleAssignment,
  type RoleConfig,
} from '@avalon/core'
import {
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconCrown,
  IconEraser,
  IconEye,
  IconHistory,
  IconPlayerPlay,
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
  Switch,
  TextField,
} from '../components/ui.tsx'
import { newId, useGames } from '../games/store.ts'
import { RoleAssignmentEditor } from '../roles/RoleAssignmentEditor.tsx'
import { RoleConfigEditor } from '../roles/RoleConfigEditor.tsx'
import { navigate } from '../router.ts'
import { mergeNames } from '../settings/roster.ts'
import { useSettings } from '../settings/store.ts'
import { emptySeats, nextEmptySeat, resizeSeats, tapRosterName } from '../setup/seats.ts'

export function SetupPage() {
  const games = useGames((s) => s.games)
  const add = useGames((s) => s.add)
  const recent = games[0]
  const roster = useSettings((s) => s.settings.roster)
  const updateSettings = useSettings((s) => s.update)

  const [count, setCount] = useState<PlayerCount>(5)
  const [names, setNames] = useState<string[]>(() => emptySeats(5))
  /** Seat that the next tapped roster name goes into. */
  const [active, setActive] = useState(0)
  const [leader, setLeader] = useState(0)
  const [customName, setCustomName] = useState('')
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null)
  const [assignment, setAssignment] = useState<RoleAssignment>({})
  const [showAssign, setShowAssign] = useState(false)

  const sizes = teamSizes(count)
  const factions = factionCounts(count)
  const players = makePlayers(names)
  const configCheck = roleConfig ? validateRoleConfig(roleConfig, count) : null
  const assignmentErrors = validateAssignment(assignment, roleConfig, count)
  const canStart = (configCheck?.ok ?? true) && assignmentErrors.length === 0

  const duplicate = useMemo(() => {
    const trimmed = names.map((n) => n.trim()).filter(Boolean)
    return trimmed.length !== new Set(trimmed).size
  }, [names])

  function changeCount(n: PlayerCount) {
    setCount(n)
    const next = resizeSeats(names, n)
    setNames(next)
    setActive(nextEmptySeat(next))
    setLeader((l) => (l < n ? l : 0))
    if (roleConfig) setRoleConfig(defaultRoleConfig(n))
    setAssignment((a) =>
      Object.fromEntries(Object.entries(a).filter(([id]) => Number(id.slice(1)) <= n)),
    )
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
    if (active === i) setActive(j)
    else if (active === j) setActive(i)
  }

  function tapName(name: string) {
    const r = tapRosterName(names, active, name)
    setNames(r.names)
    setActive(r.active)
  }

  function clearSeats() {
    setNames(emptySeats(count))
    setActive(0)
  }

  function loadRecent() {
    if (!recent) return
    setCount(recent.players.length as PlayerCount)
    setNames(recent.players.map((p) => p.name))
    setRoleConfig(recent.roleConfig)
    setAssignment({})
    setActive(-1)
    setLeader(0)
  }

  function start() {
    if (!canStart) return
    const game = createGame({
      id: newId(),
      now: new Date().toISOString(),
      players,
      firstLeaderId: players[leader]!.id,
      name: { custom: customName },
      roleConfig,
      roleAssignment: assignment,
    })
    add(game)
    updateSettings({ roster: mergeNames(roster, names) })
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
                <Button variant="ghost" className="min-h-9 px-2 text-sm" onClick={clearSeats}>
                  <IconEraser size={16} aria-hidden />
                  清空
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
                  list="roster-names"
                  onFocus={() => setActive(i)}
                  className={cx(
                    'min-h-11 min-w-0 flex-1 rounded-xl border bg-base px-3 focus:border-accent focus:outline-none',
                    active === i ? 'border-accent ring-1 ring-accent' : 'border-overlay0',
                  )}
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
          <datalist id="roster-names">
            {roster.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </datalist>

          {roster.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-subtext0">
                {active >= 0
                  ? `點名字填入第 ${active + 1} 位（再點一次移除）`
                  : '點名字移除；點選座位後可再填入'}
              </p>
              <ul className="flex flex-wrap gap-2" aria-label="玩家名冊">
                {roster.map((n) => {
                  const seated = names.some((x) => x.trim() === n)
                  return (
                    <li key={n}>
                      <button
                        type="button"
                        aria-pressed={seated}
                        onClick={() => tapName(n)}
                        className={cx(
                          'inline-flex min-h-11 items-center gap-1 rounded-full border px-4',
                          seated
                            ? 'border-accent bg-accent/15 text-accent-fg'
                            : 'border-overlay0 bg-base',
                        )}
                      >
                        {seated && <IconCheck size={16} aria-hidden />}
                        {n}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {roster.length === 0 && (
            <p className="mt-3 text-sm text-subtext0">
              提示：在設定頁建立玩家名冊，開局時就能直接點選名字。
            </p>
          )}

          {duplicate && (
            <p className="mt-2 text-sm text-fail-fg">玩家名稱重複，記錄時可能難以分辨</p>
          )}
          <p className="mt-2 flex items-center gap-1 text-sm text-subtext0">
            <IconCrown size={16} className="text-crown-fg" aria-hidden />
            第一位隊長：{names[leader]?.trim() || `${leader + 1}號`}
          </p>
        </Card>

        <Card>
          <SectionTitle>角色（可選）</SectionTitle>
          <Switch
            label="設定角色配置"
            description="記錄這場有哪些角色"
            checked={roleConfig !== null}
            onChange={(on) => setRoleConfig(on ? defaultRoleConfig(count) : null)}
          />
          {roleConfig && (
            <div className="mt-3">
              <RoleConfigEditor config={roleConfig} playerCount={count} onChange={setRoleConfig} />
            </div>
          )}
          <div className="mt-3 border-t border-surface0 pt-3">
            {showAssign ? (
              <RoleAssignmentEditor
                players={players}
                assignment={assignment}
                config={roleConfig}
                onChange={setAssignment}
              />
            ) : (
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setShowAssign(true)}
              >
                <IconEye size={18} aria-hidden />
                現在指派角色（也可在遊戲中或結算時再填）
              </Button>
            )}
          </div>
        </Card>
      </div>

      <BottomBar>
        {!canStart && (
          <p className="mb-2 text-center text-sm text-fail-fg">
            角色配置不符合人數，請修正後再開始
          </p>
        )}
        <Button variant="primary" className="w-full" disabled={!canStart} onClick={start}>
          <IconPlayerPlay size={20} aria-hidden />
          開始遊戲
        </Button>
      </BottomBar>
    </Page>
  )
}
