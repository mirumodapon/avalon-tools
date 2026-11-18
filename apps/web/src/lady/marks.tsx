import { LADY_DECLARATION_LABEL, type Faction, type LadyDeclaration } from '@avalon/core'
import { IconAlertTriangle, IconRipple } from '@tabler/icons-react'
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

export function DeclarationMark({ declared }: { declared: LadyDeclaration }) {
  if (declared === 'none')
    return <span className="text-subtext0">{LADY_DECLARATION_LABEL.none}</span>
  return (
    <span className="inline-flex items-center gap-0.5">
      <FactionMark faction={declared} showLabel={false} />
      {LADY_DECLARATION_LABEL[declared]}
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
