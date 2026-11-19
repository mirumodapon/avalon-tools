import {
  remainingFor,
  ROLES,
  validateAssignment,
  type Player,
  type PlayerId,
  type RoleAssignment,
  type RoleConfig,
  type RoleId,
} from '@avalon/record-core'
import { IconChevronDown, IconQuestionMark } from '@tabler/icons-react'
import { useState } from 'react'
import { cx } from '@avalon/ui'
import { RoleIcon } from '@avalon/ui'

/** Assign roles to players; partial assignment is fine. Used-up roles are disabled. */
export function RoleAssignmentEditor({
  players,
  assignment,
  config,
  onChange,
}: {
  players: readonly Player[]
  assignment: RoleAssignment
  config: RoleConfig | null
  onChange: (assignment: RoleAssignment) => void
}) {
  const [open, setOpen] = useState<PlayerId | null>(null)
  const errors = validateAssignment(assignment, config, players.length)
  const roles = config ? ROLES.filter((r) => (config[r.id] ?? 0) > 0) : ROLES

  function assign(playerId: PlayerId, role: RoleId | null) {
    const next = { ...assignment }
    if (role) next[playerId] = role
    else delete next[playerId]
    onChange(next)
    setOpen(null)
  }

  return (
    <div>
      <ul className="space-y-1">
        {players.map((p, i) => {
          const role = assignment[p.id]
          const expanded = open === p.id
          return (
            <li key={p.id} className="rounded-xl bg-surface0/60">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : p.id)}
                className="flex min-h-11 w-full items-center gap-2 px-3 text-left"
              >
                <span className="w-5 text-sm text-subtext0">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                {role ? (
                  <RoleIcon role={role} size={18} showName className="text-sm" />
                ) : (
                  <span className="flex items-center gap-1 text-sm text-overlay1">
                    <IconQuestionMark size={16} aria-hidden />
                    未指定
                  </span>
                )}
                <IconChevronDown
                  size={16}
                  className={cx('transition-transform', expanded && 'rotate-180')}
                  aria-hidden
                />
              </button>
              {expanded && (
                <fieldset className="grid grid-cols-2 gap-2 p-2">
                  <legend className="sr-only">{p.name}的角色</legend>
                  {roles.map((r) => {
                    const left = remainingFor(r.id, p.id, assignment, config, players.length)
                    const current = role === r.id
                    return (
                      <button
                        key={r.id}
                        type="button"
                        aria-pressed={current}
                        disabled={!current && left <= 0}
                        onClick={() => assign(p.id, r.id)}
                        className={cx(
                          'flex min-h-11 items-center gap-1 rounded-lg border px-2 text-left text-sm disabled:opacity-40',
                          current ? 'border-accent bg-accent/15' : 'border-overlay0 bg-base',
                        )}
                      >
                        <RoleIcon role={r.id} size={18} showName className="min-w-0 flex-1" />
                        {!current && left <= 0 && (
                          <span className="text-xs text-subtext0">已用完</span>
                        )}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => assign(p.id, null)}
                    className="col-span-2 flex min-h-11 items-center justify-center gap-1 rounded-lg border border-dashed border-overlay0 text-sm text-subtext0"
                  >
                    <IconQuestionMark size={16} aria-hidden />
                    不指定
                  </button>
                </fieldset>
              )}
            </li>
          )
        })}
      </ul>
      {errors.length > 0 && (
        <ul role="alert" className="mt-2 text-sm text-fail-fg">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
