import type { ViewMode } from '@avalon/core'
import { useSettings } from '../settings/store.ts'
import { Segmented } from './ui.tsx'

export const VIEW_MODE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'full', label: '派票檢視' },
  { value: 'anomaly', label: '派跳檢視' },
]

/** Global display mode toggle; remembers the last choice in settings. */
export function ViewModeToggle({ className }: { className?: string }) {
  const viewMode = useSettings((s) => s.settings.viewMode)
  const update = useSettings((s) => s.update)
  return (
    <Segmented
      label="呈現方式"
      value={viewMode}
      options={VIEW_MODE_OPTIONS}
      onChange={(v) => update({ viewMode: v })}
      className={className}
    />
  )
}
