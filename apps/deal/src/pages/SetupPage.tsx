import { PLAYER_COUNTS, roleDef, type Faction, type RoleId } from '@avalon/rules'
import {
  AppShell,
  BottomBar,
  Button,
  Card,
  ConfirmSheet,
  FACTION_ICONS,
  IconButton,
  RoleIcon,
  SectionTitle,
  Segmented,
  Switch,
  cx,
} from '@avalon/ui'
import { IconAlertTriangle, IconHistory, IconInfoCircle, IconPlayCard } from '@tabler/icons-react'
import { useState } from 'react'
import { KEEP_OPTIONS, type KeepCount } from '../history/records.ts'
import { listRecords, pruneRecords } from '../history/store.ts'
import { checkConfig, FILLER, SPECIAL_ROLES } from '../roles/config.ts'
import { navigate } from '../router.ts'
import { useSettings } from '../settings.ts'

const FACTION_TITLE: Record<Faction, string> = { good: '好人陣營', evil: '壞人陣營' }

export function SetupPage({ onStart }: { onStart: () => Promise<void> }) {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const check = checkConfig(settings)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lowerKeep, setLowerKeep] = useState<{ keep: KeepCount; drop: number } | null>(null)

  function toggle(id: RoleId, on: boolean) {
    const special = on ? [...settings.special, id] : settings.special.filter((x) => x !== id)
    update({ special })
  }

  async function changeKeep(keep: KeepCount) {
    const count = (await listRecords()).length
    if (count > keep) setLowerKeep({ keep, drop: count - keep })
    else update({ keep })
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
    <AppShell
      title="角色發牌"
      actions={
        <IconButton label="歷史紀錄" onClick={() => navigate({ name: 'history' })}>
          <IconHistory size={22} />
        </IconButton>
      }
    >
      <div className="space-y-4 pt-2">
        <Card>
          <SectionTitle>玩家人數</SectionTitle>
          <Segmented
            label="玩家人數"
            value={String(settings.playerCount)}
            options={PLAYER_COUNTS.map((n) => ({ value: String(n), label: `${n}` }))}
            onChange={(v) => update({ playerCount: Number(v) as typeof settings.playerCount })}
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

        <Card>
          <SectionTitle>歷史紀錄保留筆數</SectionTitle>
          <Segmented
            label="歷史紀錄保留筆數"
            value={String(settings.keep)}
            options={KEEP_OPTIONS.map((n) => ({ value: String(n), label: `${n} 筆` }))}
            onChange={(v) => void changeKeep(Number(v) as KeepCount)}
          />
          <p className="mt-2 text-sm text-subtext0">超過時自動刪除最舊的紀錄</p>
        </Card>
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

      <ConfirmSheet
        open={lowerKeep !== null}
        title="調低保留筆數？"
        message={lowerKeep && `將刪除 ${lowerKeep.drop} 筆舊紀錄。`}
        confirmLabel="刪除並套用"
        danger
        onConfirm={() => {
          if (!lowerKeep) return
          update({ keep: lowerKeep.keep })
          void pruneRecords(lowerKeep.keep)
        }}
        onClose={() => setLowerKeep(null)}
      />
    </AppShell>
  )
}
