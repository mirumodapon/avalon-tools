import { docsHref } from '@avalon/registry'
import { PLAYER_COUNTS, roleDef, type Faction, type RoleId } from '@avalon/rules'
import {
  AppShell,
  BottomBar,
  Button,
  Card,
  FACTION_ICONS,
  IconButton,
  RoleIcon,
  SectionTitle,
  Segmented,
  Switch,
  cx,
} from '@avalon/ui'
import {
  IconAlertTriangle,
  IconFlag,
  IconHistory,
  IconInfoCircle,
  IconPlayCard,
  IconRipple,
} from '@tabler/icons-react'
import { useState } from 'react'
import { ModeTabs, panelId, tabId, type TabOption } from '../components/ModeTabs.tsx'
import { useLady } from '../lady/store.ts'
import {
  QUEST_SIZES,
  type QuestSize,
  checkConfig,
  defaultSpecialFor,
  FILLER,
  SPECIAL_ROLES,
} from '@avalon/pass-play'
import { useQuest } from '../quest/store.ts'
import { navigate } from '../router.ts'
import { useSettings, type DealTab } from '../settings.ts'

const FACTION_TITLE: Record<Faction, string> = { good: '好人陣營', evil: '壞人陣營' }
const SIZE_OPTIONS = QUEST_SIZES.map((n) => ({ value: String(n), label: `${n} 人` }))

const TABS: TabOption<DealTab>[] = [
  { value: 'roles', label: '發角色' },
  { value: 'quest', label: '出任務' },
  { value: 'lady', label: '湖中女神' },
]

/** 發角色: deal roles to every seat (unchanged). */
function RolesPanel({ onStart }: { onStart: () => Promise<void> }) {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const check = checkConfig(settings)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(id: RoleId, on: boolean) {
    const special = on ? [...settings.special, id] : settings.special.filter((x) => x !== id)
    update({ special })
  }

  async function start() {
    setBusy(true)
    setError(null)
    try {
      await onStart()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex-1 space-y-4 pt-2">
        <Card>
          <SectionTitle>玩家人數</SectionTitle>
          <Segmented
            label="玩家人數"
            value={String(settings.playerCount)}
            options={PLAYER_COUNTS.map((n) => ({ value: String(n), label: `${n}` }))}
            onChange={(v) => {
              const playerCount = Number(v) as typeof settings.playerCount
              // A new table size starts from its usual roles; they can still be changed.
              update({ playerCount, special: defaultSpecialFor(playerCount) })
            }}
          />
          <p className="mt-3 flex gap-4 text-sm">
            <span className="text-good-fg">好人 {check.required.good}</span>
            <span className="text-evil-fg">壞人 {check.required.evil}</span>
            <span className="text-subtext0">玩家以座位號碼表示</span>
          </p>
        </Card>

        {(['good', 'evil'] as const).map((faction) => {
          const FactionIcon = FACTION_ICONS[faction]
          const fill = check.required[faction] - check.special[faction]
          return (
            <Card key={faction}>
              <SectionTitle>
                <span
                  className={cx(
                    'inline-flex items-center gap-1',
                    faction === 'good' ? 'text-good-fg' : 'text-evil-fg',
                  )}
                >
                  <FactionIcon size={16} aria-hidden />
                  {FACTION_TITLE[faction]}
                </span>
              </SectionTitle>
              <div className="divide-y divide-surface0">
                {SPECIAL_ROLES[faction].map((id) => (
                  <Switch
                    key={id}
                    label={<RoleIcon role={id} size={20} showName />}
                    checked={settings.special.includes(id)}
                    onChange={(on) => toggle(id, on)}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-subtext0">
                {fill >= 0
                  ? `其餘 ${fill} 位為${roleDef(FILLER[faction]).name}`
                  : `超過 ${-fill} 位`}
              </p>
            </Card>
          )
        })}

        {(check.errors.length > 0 || check.warnings.length > 0 || check.notes.length > 0) && (
          <ul className="space-y-1 text-sm" aria-label="配置提示">
            {check.errors.map((m) => (
              <li key={m} className="flex gap-2 text-fail-fg">
                <IconAlertTriangle size={18} className="shrink-0" aria-hidden />
                {m}
              </li>
            ))}
            {check.warnings.map((m) => (
              <li key={m} className="flex gap-2 text-forced-fg">
                <IconAlertTriangle size={18} className="shrink-0" aria-hidden />
                {m}
              </li>
            ))}
            {check.notes.map((m) => (
              <li key={m} className="flex gap-2 text-subtext1">
                <IconInfoCircle size={18} className="shrink-0" aria-hidden />
                {m}
              </li>
            ))}
          </ul>
        )}
      </div>
      <BottomBar>
        {error && <p className="mb-2 text-sm text-fail-fg">{error}</p>}
        <Button
          variant="primary"
          className="w-full"
          disabled={!check.ok || busy}
          onClick={() => void start()}
        >
          <IconPlayCard size={20} aria-hidden />
          開始發牌
        </Button>
      </BottomBar>
    </>
  )
}

/** 出任務: only how many people go on the quest. */
function QuestPanel() {
  const size = useQuest((s) => s.size)
  const setSize = useQuest((s) => s.setSize)
  const dispatch = useQuest((s) => s.dispatch)
  return (
    <>
      <div className="flex-1 space-y-4 pt-2">
        <Card>
          <SectionTitle>出任務的人數</SectionTitle>
          <Segmented
            label="出任務的人數"
            value={String(size)}
            options={SIZE_OPTIONS}
            onChange={(v) => setSize(Number(v) as QuestSize)}
          />
          <p className="mt-3 text-sm text-subtext0">手機會依序交給每一位出任務的玩家</p>
        </Card>
      </div>
      <BottomBar>
        <Button
          variant="primary"
          className="w-full"
          onClick={() => dispatch({ type: 'start', size })}
        >
          <IconFlag size={20} aria-hidden />
          開始出任務
        </Button>
      </BottomBar>
    </>
  )
}

/** 湖中女神: nothing to set up. */
function LadyPanel() {
  const dispatch = useLady((s) => s.dispatch)
  return (
    <>
      <div className="flex-1 space-y-4 pt-2">
        <Card>
          <SectionTitle>使用方式</SectionTitle>
          <ol className="list-decimal space-y-1.5 pl-5 text-subtext1">
            <li>把手機交給被查驗的玩家，選擇要亮出的身分</li>
            <li>交給湖中女神持有者，長按查看</li>
            <li>看完雙擊蓋上，湖中女神交給被查驗的玩家</li>
          </ol>
        </Card>
      </div>
      <BottomBar>
        <Button variant="primary" className="w-full" onClick={() => dispatch({ type: 'start' })}>
          <IconRipple size={20} aria-hidden />
          開始湖中女神
        </Button>
      </BottomBar>
    </>
  )
}

/** The three independent modes, each with its own settings, behind tabs. */
export function SetupPage({ onStart }: { onStart: () => Promise<void> }) {
  const tab = useSettings((s) => s.settings.tab)
  const update = useSettings((s) => s.update)

  return (
    <AppShell
      title="角色發牌"
      helpHref={docsHref('guide/dealer/')}
      actions={
        <IconButton label="歷史紀錄" onClick={() => navigate({ name: 'history' })}>
          <IconHistory size={22} />
        </IconButton>
      }
      header={
        <ModeTabs label="模式" value={tab} options={TABS} onChange={(t) => update({ tab: t })} />
      }
    >
      <div
        role="tabpanel"
        id={panelId(tab)}
        aria-labelledby={tabId(tab)}
        className="flex flex-1 flex-col"
      >
        {tab === 'roles' && <RolesPanel onStart={onStart} />}
        {tab === 'quest' && <QuestPanel />}
        {tab === 'lady' && <LadyPanel />}
      </div>
    </AppShell>
  )
}
