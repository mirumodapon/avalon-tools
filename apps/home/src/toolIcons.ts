import {
  IconApps,
  IconBuildingCastle,
  IconCards,
  IconClipboardList,
  IconMoonStars,
  type Icon,
} from '@tabler/icons-react'

/**
 * Registry icon names → components. Listed explicitly so only these icons are
 * bundled; `pnpm new:app` adds the new tool's icon here.
 */
export const TOOL_ICONS: Record<string, Icon> = {
  IconApps,
  IconBuildingCastle,
  IconCards,
  IconClipboardList,
  IconMoonStars,
  // new:app icons
}
