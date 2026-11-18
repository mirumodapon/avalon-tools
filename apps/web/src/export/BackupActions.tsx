import { gamesToJson, type Game } from '@avalon/core'
import { IconDownload, IconFileExport, IconFileImport } from '@tabler/icons-react'
import { useState } from 'react'
import { Button } from '../components/ui.tsx'
import { useGames } from '../games/store.ts'
import { useNamer } from '../naming/useDisplayName.ts'
import { ExportSheet } from './ExportSheet.tsx'
import { ImportSheet } from './ImportSheet.tsx'
import { canShare, downloadBlob, shareFile } from './share.ts'

/** All export/import entry points: one game in any format, every game as JSON, or import. */
export function BackupActions() {
  const games = useGames((s) => s.games)
  const nameOf = useNamer()
  const [importOpen, setImportOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [exporting, setExporting] = useState<Game | null>(null)
  const selected = games.find((g) => g.id === selectedId) ?? games[0]

  async function exportAll() {
    const today = new Date().toISOString().slice(0, 10)
    const filename = `avalon-全部-${today}.json`
    const blob = new Blob([gamesToJson(games)], { type: 'application/json' })
    if (canShare() && (await shareFile(new File([blob], filename, { type: blob.type })))) return
    downloadBlob(blob, filename)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="block">
          <span className="mb-1 block text-sm text-subtext0">
            匯出單場（JSON、CSV、Markdown、文字、PNG）
          </span>
          <select
            className="min-h-11 w-full rounded-xl border border-overlay0 bg-base px-3"
            disabled={games.length === 0}
            value={selected?.id ?? ''}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {games.length === 0 && <option value="">沒有遊戲</option>}
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {nameOf(g)}
              </option>
            ))}
          </select>
        </label>
        <Button
          className="w-full"
          disabled={!selected}
          onClick={() => selected && setExporting(selected)}
        >
          <IconFileExport size={20} aria-hidden />
          匯出這場
        </Button>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" disabled={games.length === 0} onClick={() => void exportAll()}>
          <IconDownload size={20} aria-hidden />
          全部匯出
        </Button>
        <Button className="flex-1" onClick={() => setImportOpen(true)}>
          <IconFileImport size={20} aria-hidden />
          匯入
        </Button>
      </div>
      <ImportSheet open={importOpen} onClose={() => setImportOpen(false)} />
      {exporting && <ExportSheet game={exporting} open onClose={() => setExporting(null)} />}
    </div>
  )
}
