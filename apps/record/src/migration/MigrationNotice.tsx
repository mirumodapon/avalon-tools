import { Button, Sheet } from '@avalon/ui'
import { IconDownload } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { downloadBlob } from '../export/share.ts'
import { exportLegacyBackup } from './fromV1.ts'
import { runMigration } from './run.ts'

/** Shown only when moving 1.x data failed: the old data is untouched and can be saved. */
export function MigrationNotice() {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    void runMigration().then((r) => alive && r.status === 'failed' && setError(r.error))
    return () => {
      alive = false
    }
  }, [])

  async function backup() {
    setBusy(true)
    try {
      const json = await exportLegacyBackup()
      downloadBlob(new Blob([json], { type: 'application/json' }), 'avalon-1.x-備份.json')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      title="舊版資料搬移失敗"
      open={error !== null}
      onClose={() => setError(null)}
      footer={
        <Button className="w-full" disabled={busy} onClick={() => void backup()}>
          <IconDownload size={20} aria-hidden />
          匯出舊資料備份
        </Button>
      }
    >
      <div className="space-y-2 text-sm text-subtext1">
        <p>1.x 的紀錄沒能搬到新版。舊資料仍完整保留，下次開啟時會再試一次。</p>
        <p>建議先匯出備份；備份檔可以在「設定 → 匯入」重新匯入。</p>
        <p className="font-mono text-xs text-subtext0">{error}</p>
      </div>
    </Sheet>
  )
}
