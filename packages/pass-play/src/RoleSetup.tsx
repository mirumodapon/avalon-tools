import { PLAYER_COUNTS, roleDef, type Faction, type PlayerCount, type RoleId } from '@avalon/rules'
import { Card, cx, FACTION_ICONS, RoleIcon, SectionTitle, Segmented, Switch } from '@avalon/ui'
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { checkConfig, defaultSpecialFor, FILLER, SPECIAL_ROLES } from './roleConfig.ts'

const FACTION_TITLE: Record<Faction, string> = { good: '好人陣營', evil: '壞人陣營' }

export interface RoleSelection {
  playerCount: PlayerCount
  special: RoleId[]
}

/**
 * Player count and the special roles in play, with the configuration hints. Changing the
 * count starts from that table size's usual roles. `hint` goes under the faction counts.
 */
export function RoleSetup({
  playerCount,
  special,
  onChange,
  hint,
}: RoleSelection & { onChange: (next: RoleSelection) => void; hint?: ReactNode }) {
  const check = checkConfig({ playerCount, special })

  function toggle(id: RoleId, on: boolean) {
    onChange({ playerCount, special: on ? [...special, id] : special.filter((x) => x !== id) })
  }

  return (
    <>
      <Card>
        <SectionTitle>玩家人數</SectionTitle>
        <Segmented
          label="玩家人數"
          value={String(playerCount)}
          options={PLAYER_COUNTS.map((n) => ({ value: String(n), label: `${n}` }))}
          onChange={(v) => {
            const next = Number(v) as PlayerCount
            // A new table size starts from its usual roles; they can still be changed.
            onChange({ playerCount: next, special: defaultSpecialFor(next) })
          }}
        />
        <p className="mt-3 flex gap-4 text-sm">
          <span className="text-good-fg">好人 {check.required.good}</span>
          <span className="text-evil-fg">壞人 {check.required.evil}</span>
          {hint && <span className="text-subtext0">{hint}</span>}
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
                  checked={special.includes(id)}
                  onChange={(on) => toggle(id, on)}
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-subtext0">
              {fill >= 0 ? `其餘 ${fill} 位為${roleDef(FILLER[faction]).name}` : `超過 ${-fill} 位`}
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
    </>
  )
}
