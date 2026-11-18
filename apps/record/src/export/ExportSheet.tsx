import type { Game, ViewMode } from '@avalon/record-core'
import {
  IconClipboard,
  IconDownload,
  IconLoader2,
  IconPhotoDown,
  IconShare,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { HistoryTable } from '../components/HistoryTable.tsx'
import { Sheet } from '@avalon/ui'
import { Button, cx, Segmented, Switch } from '@avalon/ui'
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
import {
  canSaveImageToPhotos,
  canShare,
  copyImage,
  copyText,
  downloadBlob,
  shareFile,
} from './share.ts'

const FORMATS: ExportFormat[] = ['json', 'csv', 'markdown', 'text', 'png']

type Action = 'download' | 'copy' | 'share' | 'photos'

export function ExportSheet({
  game,
  open,
  onClose,
  defaultIncludeRoles,
}: {
  game: Game
  open: boolean
  onClose: () => void
  /** Whether roles start included; defaults to the browsing role setting. */
  defaultIncludeRoles?: boolean
}) {
  const settings = useSettings((s) => s.settings)
  const name = useDisplayName(game)
  const [format, setFormat] = useState<ExportFormat>('json')
  const [viewMode, setViewMode] = useState<ViewMode>(settings.viewMode)
  const [includeRoles, setIncludeRoles] = useState(defaultIncludeRoles ?? settings.showRoles)
  const [status, setStatus] = useState<string | null>(null)
  /** Action in progress; buttons are disabled and show a spinner meanwhile. */
  const [busy, setBusy] = useState<Action | null>(null)
  const pngRef = useRef<HTMLDivElement>(null)

  const opts = { name, viewMode, includeRoles }
  const text = format === 'png' ? null : exportText(game, format, opts)
  const filename = exportFilename(name, format)

  const [toPhotos] = useState(canSaveImageToPhotos)
  const savesToPhotos = format === 'png' && toPhotos
  /** PNG rendered ahead of time on phones: sharing must start right after the tap. */
  const [readyPng, setReadyPng] = useState<Blob | null>(null)

  async function renderPng(): Promise<Blob> {
    const node = pngRef.current
    if (!node) throw new Error('無法產生圖片')
    const { toBlob } = await import('html-to-image')
    const bg = getComputedStyle(document.body).backgroundColor
    const b = await toBlob(node, { pixelRatio: 2, backgroundColor: bg, cacheBust: true })
    if (!b) throw new Error('無法產生圖片')
    return b
  }

  useEffect(() => {
    setReadyPng(null)
    if (!open || !savesToPhotos) return
    let alive = true
    const frame = requestAnimationFrame(() => {
      renderPng().then(
        (b) => alive && setReadyPng(b),
        (e: unknown) => alive && setStatus(e instanceof Error ? e.message : String(e)),
      )
    })
    return () => {
      alive = false
      cancelAnimationFrame(frame)
    }
    // renderPng reads the rendered preview, which depends on these inputs.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [open, savesToPhotos, viewMode, includeRoles, game])

  async function blob(): Promise<Blob> {
    if (text !== null) return new Blob([text], { type: mimeOf(format) })
    return readyPng ?? renderPng()
  }

  function saveToPhotos() {
    if (!readyPng) return
    setStatus(null)
    setBusy('photos')
    // No await before share(): iOS only allows it directly in response to the tap.
    shareFile(new File([readyPng], filename, { type: 'image/png' }))
      .then((ok) => {
        if (ok) setStatus('在分享選單選擇「儲存影像」即可存進相簿')
      })
      .finally(() => setBusy(null))
  }

  async function run(action: Action) {
    if (busy) return
    setStatus(null)
    setBusy(action)
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
    } finally {
      setBusy(null)
    }
  }

  const spinner = <IconLoader2 size={20} className="animate-spin" aria-hidden />

  return (
    <Sheet
      title="匯出"
      open={open}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {savesToPhotos ? (
            <>
              <Button
                variant="primary"
                className="flex-1"
                disabled={busy !== null || !readyPng}
                aria-busy={!readyPng || busy === 'photos'}
                onClick={saveToPhotos}
              >
                {!readyPng || busy === 'photos' ? spinner : <IconPhotoDown size={20} aria-hidden />}
                {readyPng ? '儲存到相簿' : '產生中…'}
              </Button>
              <Button
                disabled={busy !== null || !readyPng}
                onClick={() => void run('download')}
                aria-label="下載檔案"
              >
                <IconDownload size={20} aria-hidden />
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              className="flex-1"
              disabled={busy !== null}
              aria-busy={busy === 'download'}
              onClick={() => void run('download')}
            >
              {busy === 'download' ? spinner : <IconDownload size={20} aria-hidden />}
              {busy === 'download' ? '產生中…' : '下載'}
            </Button>
          )}
          <Button
            disabled={busy !== null}
            aria-busy={busy === 'copy'}
            onClick={() => void run('copy')}
            aria-label="複製到剪貼簿"
          >
            {busy === 'copy' ? spinner : <IconClipboard size={20} aria-hidden />}
          </Button>
          {canShare() && !savesToPhotos && (
            <Button
              disabled={busy !== null}
              aria-busy={busy === 'share'}
              onClick={() => void run('share')}
              aria-label="分享"
            >
              {busy === 'share' ? spinner : <IconShare size={20} aria-hidden />}
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
