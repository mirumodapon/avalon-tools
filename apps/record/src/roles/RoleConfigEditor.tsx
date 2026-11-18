import {
  defaultRoleConfig,
  FACTION_LABEL,
  roleCount,
  roleDef,
  ROLES,
  validateRoleConfig,
  type RoleConfig,
  type RoleId,
} from '@avalon/record-core'
import { IconMinus, IconPlus, IconRefresh } from '@tabler/icons-react'
import { Button, cx, IconButton } from '@avalon/ui'
import { FactionMark, RoleIcon } from './roleIcons.tsx'

/** +/- counts per role, validated against the faction split. */
export function RoleConfigEditor({
  config,
  playerCount,
  onChange,
}: {
  config: RoleConfig
  playerCount: number
  onChange: (config: RoleConfig) => void
}) {
  const check = validateRoleConfig(config, playerCount)

  function set(id: RoleId, n: number) {
    const next = { ...config, [id]: Math.max(0, n) }
    if (next[id] === 0) delete next[id]
    onChange(next)
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex gap-3 text-sm">
          {(['good', 'evil'] as const).map((f) => (
            <span key={f} className="flex items-center gap-1">
              <FactionMark faction={f} />
              {FACTION_LABEL[f]}
              <strong className={check.counts[f] === check.required[f] ? '' : 'text-fail-fg'}>
                {check.counts[f]} / {check.required[f]}
              </strong>
            </span>
          ))}
        </p>
        <Button
          variant="ghost"
          className="min-h-9 px-2 text-sm"
          onClick={() => onChange(defaultRoleConfig(playerCount))}
        >
          <IconRefresh size={16} aria-hidden />
          預設配置
        </Button>
      </div>
      <ul className="divide-y divide-surface0">
        {ROLES.map((r) => {
          const n = roleCount(config, r.id)
          return (
            <li key={r.id} className="flex items-center gap-2 py-1">
              <RoleIcon
                role={r.id}
                size={20}
                showName
                className="min-w-0 flex-1 text-text [&>svg]:shrink-0"
              />
              <IconButton
                label={`減少${r.name}`}
                disabled={n === 0}
                onClick={() => set(r.id, n - 1)}
              >
                <IconMinus size={18} />
              </IconButton>
              <span
                className={cx('w-6 text-center font-semibold', n === 0 && 'text-overlay1')}
                aria-label={`${r.name} ${n} 位`}
              >
                {n}
              </span>
              <IconButton
                label={`增加${r.name}`}
                disabled={roleDef(r.id).unique && n >= 1}
                onClick={() => set(r.id, n + 1)}
              >
                <IconPlus size={18} />
              </IconButton>
            </li>
          )
        })}
      </ul>
      {check.errors.length > 0 && (
        <ul role="alert" className="mt-2 space-y-0.5 text-sm text-fail-fg">
          {check.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {check.warnings.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-sm text-forced-fg">
          {check.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
