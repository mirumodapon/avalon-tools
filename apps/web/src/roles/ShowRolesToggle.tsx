import { IconMasksTheater, IconMasksTheaterOff } from '@tabler/icons-react'
import { useSettings } from '../settings/store.ts'
import { cx } from '../components/ui.tsx'

/** Compact on/off button for role visibility. */
export function ShowRolesButton({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cx(
        'inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-3 text-sm',
        checked ? 'bg-accent text-on-accent' : 'bg-surface0 text-subtext1',
      )}
    >
      {checked ? (
        <IconMasksTheater size={18} aria-hidden />
      ) : (
        <IconMasksTheaterOff size={18} aria-hidden />
      )}
      顯示角色
    </button>
  )
}

/** Global toggle for browsing views; remembers the last choice. */
export function GlobalShowRolesButton() {
  const showRoles = useSettings((s) => s.settings.showRoles)
  const update = useSettings((s) => s.update)
  return <ShowRolesButton checked={showRoles} onChange={(v) => update({ showRoles: v })} />
}
