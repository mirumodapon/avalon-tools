import { gamesToJson } from '@avalon/core'
import { IconDownload, IconFileImport } from '@tabler/icons-react'
import { useState } from 'react'
import { Button } from '../components/ui.tsx'
import { useGames } from '../games/store.ts'
import { ScanButton } from '../share/QrScanner.tsx'
import { ImportSheet } from './ImportSheet.tsx'
import { canShare, downloadBlob, shareFile } from './share.ts'

/** Backup: every game as one JSON array, or import. (Single-game export lives on the game page.) */
export function BackupActions() {
  const games = useGames((s) => s.games)
  const [importOpen, setImportOpen] = useState(false)

  async function exportAll() {
    const today = new Date().toISOString().slice(0, 10)
    const filename = `avalon-全部-${today}.json`
    const blob = new Blob([gamesToJson(games)], { type: 'application/json' })
    if (canShare() && (await shareFile(new File([blob], filename, { type: blob.type })))) return
    downloadBlob(blob, filename)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button className="col-span-2" disabled={games.length === 0} onClick={() => void exportAll()}>
        <IconDownload size={20} aria-hidden />
        全部匯出
      </Button>
      <Button onClick={() => setImportOpen(true)}>
        <IconFileImport size={20} aria-hidden />
        匯入
      </Button>
      <ScanButton variant="full" />
      <ImportSheet open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
