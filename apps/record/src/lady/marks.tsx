import { LADY_DECLARATION_LABEL, type Faction, type LadyDeclaration } from '@avalon/record-core'
import { IconAlertTriangle, IconRipple, IconUserCheck, IconUserX } from '@tabler/icons-react'
import { cx } from '../components/ui.tsx'
import { FactionMark } from '../roles/roleIcons.tsx'

export function LadyIcon({
  size = 16,
  label = '湖中女神',
  className,
}: {
  size?: number
  label?: string
  className?: string
}) {
  return (
    <span className={cx('inline-flex text-lady-fg', className)} title={label}>
      <IconRipple size={size} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Icon for a Lady declaration: a verified person (好) or a rejected one (壞). */
export function VerdictIcon({ declared, size = 16 }: { declared: LadyDeclaration; size?: number }) {
  if (declared === 'none') {
    return (
      <span className="text-subtext0" title={LADY_DECLARATION_LABEL.none}>
        <span aria-hidden>—</span>
        <span className="sr-only">{LADY_DECLARATION_LABEL.none}</span>
      </span>
    )
  }
  const good = declared === 'good'
  const Icon = good ? IconUserCheck : IconUserX
  return (
    <span
      className={cx('inline-flex', good ? 'text-good-fg' : 'text-evil-fg')}
      title={LADY_DECLARATION_LABEL[declared]}
    >
      <Icon size={size} aria-hidden />
      <span className="sr-only">{good ? '好人' : '壞人'}</span>
    </span>
  )
}

export function DeclarationMark({ declared }: { declared: LadyDeclaration }) {
  if (declared === 'none')
    return <span className="text-subtext0">{LADY_DECLARATION_LABEL.none}</span>
  return (
    <span className="inline-flex items-center gap-0.5">
      <VerdictIcon declared={declared} />
      <span aria-hidden>{LADY_DECLARATION_LABEL[declared]}</span>
    </span>
  )
}

/** Real faction plus a peach "說謊" warning when the declaration contradicts it. */
export function LadyTruthMark({ truth, lied }: { truth: Faction; lied: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center gap-0.5 text-subtext0">
        實際
        <FactionMark faction={truth} showLabel />
      </span>
      {lied && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-lie/15 px-1.5 font-semibold text-lie-fg">
          <IconAlertTriangle size={14} aria-hidden />
          說謊
        </span>
      )}
    </span>
  )
}
