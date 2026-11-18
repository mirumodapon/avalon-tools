import type { ViewMode } from '@avalon/core'
import { IconFilter, IconTable } from '@tabler/icons-react'
import { useSettings } from '../settings/store.ts'
import { Segmented } from './ui.tsx'

export const VIEW_MODE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'full', label: '派票檢視' },
  { value: 'anomaly', label: '派跳檢視' },
]

const ICON_OPTIONS = [
  {
    value: 'full' as const,
    label: (
      <span className="flex items-center" title="派票檢視：完整贊成／反對">
        <IconTable size={20} aria-hidden />
        <span className="sr-only">派票檢視</span>
      </span>
    ),
  },
  {
    value: 'anomaly' as const,
    label: (
      <span className="flex items-center" title="派跳檢視：只看場外白／場內黑">
        <IconFilter size={20} aria-hidden />
        <span className="sr-only">派跳檢視</span>
      </span>
    ),
  },
]

/** Global display mode toggle (icons only); remembers the last choice in settings. */
export function ViewModeToggle({ className }: { className?: string }) {
  const viewMode = useSettings((s) => s.settings.viewMode)
  const update = useSettings((s) => s.update)
  return (
    <Segmented
      label="呈現方式"
      value={viewMode}
      options={ICON_OPTIONS}
      onChange={(v) => update({ viewMode: v })}
      className={className}
    />
  )
}
