import { FACTION_LABEL, roleDef, type Faction, type RoleId } from '@avalon/rules'
import {
  IconEye,
  IconEyeOff,
  IconGhost,
  IconMask,
  IconMoon,
  IconShield,
  IconSkull,
  IconSun,
  IconSword,
  IconWand,
  type Icon,
} from '@tabler/icons-react'
import { cx } from './ui.tsx'

/** Role → Tabler icon. The leader uses IconCrown, which no role shares. */
export const ROLE_ICONS: Record<RoleId, Icon> = {
  merlin: IconWand,
  percival: IconEye,
  loyal: IconShield,
  morgana: IconMask,
  assassin: IconSword,
  mordred: IconEyeOff,
  oberon: IconGhost,
  minion: IconSkull,
}

export const FACTION_ICONS: Record<Faction, Icon> = { good: IconSun, evil: IconMoon }

export function factionText(f: Faction): string {
  return f === 'good' ? 'text-good-fg' : 'text-evil-fg'
}

export function RoleIcon({
  role,
  size = 16,
  showName = false,
  className,
}: {
  role: RoleId
  size?: number
  showName?: boolean
  className?: string
}) {
  const def = roleDef(role)
  const Icon = ROLE_ICONS[role]
  return (
    <span
      className={cx('inline-flex items-center gap-1', factionText(def.faction), className)}
      title={`${def.name}（${FACTION_LABEL[def.faction]}）`}
    >
      <Icon size={size} aria-hidden />
      <span className={showName ? '' : 'sr-only'}>{def.name}</span>
    </span>
  )
}

export function FactionMark({
  faction,
  size = 14,
  showLabel = false,
}: {
  faction: Faction
  size?: number
  showLabel?: boolean
}) {
  const Icon = FACTION_ICONS[faction]
  return (
    <span
      className={cx('inline-flex items-center gap-0.5', factionText(faction))}
      title={FACTION_LABEL[faction]}
    >
      <Icon size={size} aria-hidden />
      <span className={showLabel ? '' : 'sr-only'}>{FACTION_LABEL[faction]}</span>
    </span>
  )
}
