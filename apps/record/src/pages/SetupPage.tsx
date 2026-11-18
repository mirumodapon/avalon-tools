import {
  createGame,
  defaultLadyHolder,
  defaultRoleConfig,
  factionCounts,
  ladyEnabledByDefault,
  LADY_RECOMMENDED_MIN_PLAYERS,
  makePlayers,
  nextSeq,
  PLAYER_COUNTS,
  renderName,
  teamSizes,
  validateAssignment,
  validateRoleConfig,
  type PlayerCount,
  type PlayerId,
  type RoleAssignment,
  type RoleConfig,
} from '@avalon/record-core'
import {
  IconArrowDown,
  IconArrowUp,
  IconCrown,
  IconEraser,
  IconEye,
  IconHistory,
  IconPlayerPlay,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { Page, SettingsLink } from '../components/Layout.tsx'
import { SelectField } from '../components/Select.tsx'
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
import { LadyIcon } from '../lady/marks.tsx'
import { RoleAssignmentEditor } from '../roles/RoleAssignmentEditor.tsx'
import { RoleConfigEditor } from '../roles/RoleConfigEditor.tsx'
import { navigate } from '../router.ts'
import { mergeNames } from '../settings/roster.ts'
import { useSettings } from '../settings/store.ts'
import { RosterPicker } from '../setup/RosterPicker.tsx'
import { emptySeats, nextEmptySeat, resizeSeats, seatPicked } from '../setup/seats.ts'
import { SeatNo } from '../play/ProposalForm.tsx'

/**
 * New game setup. With `from`, players and role config are copied from that game
 * (複製為新局); role assignments are never copied.
 */
export function SetupPage({ from }: { from?: string }) {
  const games = useGames((s) => s.games)
  const add = useGames((s) => s.add)
  const recent = games[0]
  const source = from ? games.find((g) => g.id === from) : undefined
  const roster = useSettings((s) => s.settings.roster)
  const naming = useSettings((s) => s.settings.naming)
  const [startedAt] = useState(() => new Date())
  const updateSettings = useSettings((s) => s.update)

  const [count, setCount] = useState<PlayerCount>(
    () => (source?.players.length as PlayerCount | undefined) ?? 5,
  )
  const [names, setNames] = useState<string[]>(
    () => source?.players.map((p) => p.name) ?? emptySeats(5),
  )
  /** Seat that the next tapped roster name goes into. */
  const [active, setActive] = useState(source ? -1 : 0)
  const [leader, setLeader] = useState(0)
  const [customName, setCustomName] = useState('')
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(source?.roleConfig ?? null)
  const [assignment, setAssignment] = useState<RoleAssignment>({})
  const [showAssign, setShowAssign] = useState(false)
  const [ladyOn, setLadyOn] = useState(source ? source.lady !== null : ladyEnabledByDefault(5))
  /** Manually chosen initial holder; null follows the default (right of first leader). */
  const [ladyHolder, setLadyHolder] = useState<PlayerId | null>(null)

  const sizes = teamSizes(count)
  const factions = factionCounts(count)
  const seq = nextSeq(games, startedAt)
  const autoName = renderName(naming, { startedAt, seq, players: count, winner: null })
  const players = makePlayers(names)
  const defaultHolder = defaultLadyHolder(players, players[leader]!.id)
  const ladyInitial =
    ladyHolder && players.some((p) => p.id === ladyHolder) ? ladyHolder : defaultHolder
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
    setLadyOn(ladyEnabledByDefault(n))
    setLadyHolder(null)
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

  /** Seats the picked roster names in order and sizes the game to match. */
  function applyRoster(picked: string[]) {
    // Fewer picks than seats is fine; only grow the table when more were picked.
    const n = Math.max(count, picked.length) as PlayerCount
    const next = seatPicked(names, picked, n)
    if (n !== count) {
      setCount(n)
      if (roleConfig) setRoleConfig(defaultRoleConfig(n))
      setLadyOn(ladyEnabledByDefault(n))
      setLadyHolder(null)
    }
    setNames(next)
    setActive(nextEmptySeat(next, picked.length))
    setAssignment({})
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
    setLadyOn(recent.lady !== null)
    setLadyHolder(null)
    setActive(-1)
    setLeader(0)
  }

  function start() {
    if (!canStart) return
    const game = createGame({
      id: newId(),
      now: startedAt.toISOString(),
      players,
      firstLeaderId: players[leader]!.id,
      name: { custom: customName, auto: autoName, seq },
      roleConfig,
      roleAssignment: assignment,
      lady: ladyOn ? { initialHolderId: ladyInitial } : null,
    })
    add(game)
    updateSettings({ roster: mergeNames(roster, names) })
    navigate({ name: 'play', id: game.id }, { replace: true })
  }

  return (
    <Page
      title={source ? '複製為新局' : '開新局'}
      back={{ name: 'home' }}
      actions={<SettingsLink />}
    >
      <div className="space-y-4">
        <Card>
          <TextField
            label="遊戲名稱（可留空）"
            value={customName}
            onChange={setCustomName}
            placeholder={autoName}
            hint={customName.trim() ? undefined : `留空時自動命名為「${autoName}」`}
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
          <div className="mb-3 flex items-center gap-2">
            <RosterPicker roster={roster} onDone={applyRoster} className="flex-1" />
            {recent && (
              <IconButton label="帶入最近一場的玩家" onClick={loadRecent} className="bg-surface0">
                <IconHistory size={20} />
              </IconButton>
            )}
            <IconButton label="清空所有座位" onClick={clearSeats} className="bg-surface0">
              <IconEraser size={20} />
            </IconButton>
          </div>
          {roster.length === 0 && (
            <p className="mb-3 text-xs text-subtext0">在設定頁建立玩家名冊後，就能依序點選帶入。</p>
          )}

          <ol className="divide-y divide-surface0">
            {names.map((name, i) => (
              <li key={i} className="flex items-center gap-1 py-1.5">
                <SeatNo n={i + 1} />
                <input
                  aria-label={`第 ${i + 1} 位玩家名稱`}
                  onFocus={() => setActive(i)}
                  className={cx(
                    'ml-1 min-h-11 min-w-0 flex-1 rounded-xl border bg-base px-3 focus:border-accent focus:outline-none',
                    active === i ? 'border-accent' : 'border-overlay0',
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
                  className={cx('w-10', leader === i ? 'text-crown-fg!' : 'text-overlay0!')}
                >
                  <IconCrown size={22} />
                </IconButton>
                <IconButton
                  label="往上移"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="w-9"
                >
                  <IconArrowUp size={18} />
                </IconButton>
                <IconButton
                  label="往下移"
                  disabled={i === names.length - 1}
                  onClick={() => move(i, 1)}
                  className="w-9"
                >
                  <IconArrowDown size={18} />
                </IconButton>
              </li>
            ))}
          </ol>

          <div className="mt-2 space-y-1 border-t border-surface0 pt-2 text-sm">
            <p className="flex items-center gap-1 text-subtext0">
              <IconCrown size={16} className="text-crown-fg" aria-hidden />
              第一位隊長：
              <span className="font-semibold text-text">
                {names[leader]?.trim() || `${leader + 1}號`}
              </span>
            </p>
            {duplicate && <p className="text-fail-fg">玩家名稱重複，記錄時可能難以分辨</p>}
          </div>
        </Card>

        <Card>
          <SectionTitle>擴充</SectionTitle>
          <Switch
            label={
              <span className="flex items-center gap-1">
                <LadyIcon size={18} />
                湖中女神
              </span>
            }
            description="第 2、3、4 個任務後查驗一位玩家的陣營"
            checked={ladyOn}
            onChange={setLadyOn}
          />
          {ladyOn && count < LADY_RECOMMENDED_MIN_PLAYERS && (
            <p className="mt-1 text-sm text-forced-fg">官方建議湖中女神用於 7 人以上的遊戲</p>
          )}
          {ladyOn && (
            <div className="mt-3">
              <SelectField
                label="湖中女神初始持有者"
                value={ladyInitial}
                options={players.map((p) => ({
                  value: p.id,
                  label: p.id === defaultHolder ? `${p.name}（預設：第一位隊長右手邊）` : p.name,
                }))}
                onChange={setLadyHolder}
              />
            </div>
          )}
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
                <span className="flex flex-col items-start leading-tight">
                  <span>現在指派角色</span>
                  <span className="text-xs text-subtext0">也可在遊戲中或結算時再填</span>
                </span>
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
