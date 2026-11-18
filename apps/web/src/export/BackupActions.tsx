import { gamesToJson } from '@avalon/core'
import { IconDownload, IconFileImport } from '@tabler/icons-react'
import { useState } from 'react'
import { Button } from '../components/ui.tsx'
import { useGames } from '../games/store.ts'
import { ImportSheet } from './ImportSheet.tsx'
import { canShare, downloadBlob, shareFile } from './share.ts'

/** Backup actions: export every game as a JSON array, or import. */
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
    <div className="flex gap-2">
      <Button className="flex-1" disabled={games.length === 0} onClick={() => void exportAll()}>
        <IconDownload size={20} aria-hidden />
        全部匯出
      </Button>
      <Button className="flex-1" onClick={() => setImportOpen(true)}>
        <IconFileImport size={20} aria-hidden />
        匯入
      </Button>
      <ImportSheet open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
