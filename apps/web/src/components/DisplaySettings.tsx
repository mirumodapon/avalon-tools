import { IconAdjustmentsHorizontal } from '@tabler/icons-react'
import { useState } from 'react'
import { useSettings } from '../settings/store.ts'
import type { Detail } from '../settings/settings.ts'
import { Sheet } from './Sheet.tsx'
import { Button, Segmented, Switch } from './ui.tsx'

const DETAIL_OPTIONS: { value: Detail; label: string }[] = [
  { value: 'simple', label: '簡化' },
  { value: 'detailed', label: '詳細' },
]

/**
 * 「顯示設定」: role visibility plus quest / Lady result detail.
 * `showRoles` is passed in because in-progress games keep their own (default off) value.
 */
export function DisplaySettingsButton({
  showRoles,
  onShowRoles,
}: {
  showRoles: boolean
  onShowRoles: (v: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const display = useSettings((s) => s.settings.display)
  const update = useSettings((s) => s.update)
  return (
    <>
      <Button className="shrink-0 px-3" onClick={() => setOpen(true)}>
        <IconAdjustmentsHorizontal size={20} aria-hidden />
        顯示設定
      </Button>
      <Sheet title="顯示設定" open={open} onClose={() => setOpen(false)}>
        <div className="space-y-5">
          <Switch
            label="顯示角色"
            description="關閉時不顯示任何角色與陣營資訊"
            checked={showRoles}
            onChange={onShowRoles}
          />
          <div>
            <p className="mb-1 text-sm text-subtext0">局次結果</p>
            <Segmented
              label="局次結果"
              value={display.questResult}
              options={DETAIL_OPTIONS}
              onChange={(questResult) => update({ display: { ...display, questResult } })}
            />
            <p className="mt-1 text-xs text-subtext0">簡化：以顏色區分成功／失敗並顯示失敗張數</p>
          </div>
          <div>
            <p className="mb-1 text-sm text-subtext0">湖中女神結果</p>
            <Segmented
              label="湖中女神結果"
              value={display.ladyResult}
              options={DETAIL_OPTIONS}
              onChange={(ladyResult) => update({ display: { ...display, ladyResult } })}
            />
            <p className="mt-1 text-xs text-subtext0">簡化：座位號 → 座位號：宣告陣營</p>
          </div>
        </div>
      </Sheet>
    </>
  )
}

/** Uses the global (remembered) role visibility; for browsing views. */
export function GlobalDisplaySettingsButton() {
  const showRoles = useSettings((s) => s.settings.showRoles)
  const update = useSettings((s) => s.update)
  return (
    <DisplaySettingsButton showRoles={showRoles} onShowRoles={(v) => update({ showRoles: v })} />
  )
}
