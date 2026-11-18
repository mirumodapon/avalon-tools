import type { Game, ViewMode } from '@avalon/core'
import { IconClipboard, IconDownload, IconShare } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { HistoryTable } from '../components/HistoryTable.tsx'
import { Sheet } from '../components/Sheet.tsx'
import { Button, cx, Segmented, Switch } from '../components/ui.tsx'
import { VIEW_MODE_OPTIONS } from '../components/ViewModeToggle.tsx'
import { useDisplayName } from '../naming/useDisplayName.ts'
import { useSettings } from '../settings/store.ts'
import {
  exportFilename,
  exportText,
  FORMAT_HINT,
  FORMAT_LABEL,
  mimeOf,
  type ExportFormat,
} from './formats.ts'
import { canShare, copyImage, copyText, downloadBlob, shareFile } from './share.ts'

const FORMATS: ExportFormat[] = ['json', 'csv', 'markdown', 'text', 'png']

export function ExportSheet({
  game,
  open,
  onClose,
}: {
  game: Game
  open: boolean
  onClose: () => void
}) {
  const settings = useSettings((s) => s.settings)
  const name = useDisplayName(game)
  const [format, setFormat] = useState<ExportFormat>('json')
  const [viewMode, setViewMode] = useState<ViewMode>(settings.viewMode)
  const [includeRoles, setIncludeRoles] = useState(settings.showRoles)
  const [status, setStatus] = useState<string | null>(null)
  const pngRef = useRef<HTMLDivElement>(null)

  const opts = { name, viewMode, includeRoles }
  const text = format === 'png' ? null : exportText(game, format, opts)
  const filename = exportFilename(name, format)

  async function blob(): Promise<Blob> {
    if (text !== null) return new Blob([text], { type: mimeOf(format) })
    const node = pngRef.current
    if (!node) throw new Error('無法產生圖片')
    const { toBlob } = await import('html-to-image')
    const bg = getComputedStyle(document.body).backgroundColor
    const b = await toBlob(node, { pixelRatio: 2, backgroundColor: bg, cacheBust: true })
    if (!b) throw new Error('無法產生圖片')
    return b
  }

  async function run(action: 'download' | 'copy' | 'share') {
    setStatus(null)
    try {
      if (action === 'copy') {
        const ok = text !== null ? await copyText(text) : await copyImage(await blob())
        setStatus(ok ? '已複製到剪貼簿' : '此瀏覽器無法複製，請改用下載')
        return
      }
      const b = await blob()
      if (action === 'download') {
        downloadBlob(b, filename)
        setStatus(`已下載 ${filename}`)
      } else {
        const ok = await shareFile(new File([b], filename, { type: b.type }), text ?? undefined)
        if (!ok) setStatus('未分享')
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <Sheet
      title="匯出"
      open={open}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="primary" className="flex-1" onClick={() => void run('download')}>
            <IconDownload size={20} aria-hidden />
            下載
          </Button>
          <Button onClick={() => void run('copy')} aria-label="複製到剪貼簿">
            <IconClipboard size={20} aria-hidden />
          </Button>
          {canShare() && (
            <Button onClick={() => void run('share')} aria-label="分享">
              <IconShare size={20} aria-hidden />
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm text-subtext0">格式</legend>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map((f) => (
              <label
                key={f}
                className={cx(
                  'flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm has-focus-visible:outline-2 has-focus-visible:outline-accent',
                  format === f ? 'border-accent bg-accent/15 font-semibold' : 'border-overlay0',
                )}
              >
                <input
                  type="radio"
                  name="export-format"
                  className="sr-only"
                  checked={format === f}
                  onChange={() => setFormat(f)}
                />
                {FORMAT_LABEL[f]}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-subtext0">{FORMAT_HINT[format]}</p>
        </fieldset>

        {format !== 'json' && (
          <div className="space-y-3">
            <Segmented
              label="呈現方式"
              value={viewMode}
              options={VIEW_MODE_OPTIONS}
              onChange={setViewMode}
            />
            <Switch label="包含角色" checked={includeRoles} onChange={setIncludeRoles} />
          </div>
        )}

        <p className="truncate text-sm text-subtext0">檔名：{filename}</p>
        {status && <output className="block text-sm text-subtext1">{status}</output>}

        {text !== null ? (
          <textarea
            readOnly
            aria-label="預覽"
            value={text.replace(/^﻿/, '')}
            className="h-56 w-full rounded-xl border border-overlay0 bg-mantle p-2 font-mono text-xs"
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-overlay0">
            <div ref={pngRef} className="w-[390px] bg-base p-4 text-text">
              <p className="mb-1 text-lg font-bold">{name}</p>
              {game.note && (
                <p className="mb-3 max-w-md text-sm whitespace-pre-wrap text-subtext1">
                  {game.note}
                </p>
              )}
              <HistoryTable game={game} viewMode={viewMode} showRoles={includeRoles} />
            </div>
          </div>
        )}
      </div>
    </Sheet>
  )
}
