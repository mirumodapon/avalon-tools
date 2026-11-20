import type { Game, ViewMode } from '@avalon/record-core'
import {
  IconCheck,
  IconClipboard,
  IconCopy,
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
import { shareUrl } from '../share/link.ts'
import { QrCode } from '../share/QrCode.tsx'
import {
  exportFilename,
  exportText,
  FORMAT_HINT,
  FORMAT_LABEL,
  isShareFormat,
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

const FORMATS: ExportFormat[] = ['json', 'text', 'png', 'link', 'qr']

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
  const qrRef = useRef<HTMLDivElement>(null)

  const opts = { name, viewMode, includeRoles }
  const text = format === 'json' || format === 'text' ? exportText(game, format, opts) : null
  const filename = format === 'link' ? null : exportFilename(name, format)
  const sharing = isShareFormat(format)
  /** The share link, built (compressed) once the link or QR code format is chosen. */
  const [url, setUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
    if (!sharing) return
    let alive = true
    void shareUrl(game).then((u) => alive && setUrl(u))
    return () => {
      alive = false
    }
  }, [sharing, game])

  const [toPhotos] = useState(canSaveImageToPhotos)
  const savesToPhotos = format === 'png' && toPhotos
  /** PNG rendered ahead of time on phones: sharing must start right after the tap. */
  const [readyPng, setReadyPng] = useState<Blob | null>(null)
  /** The phone pre-render is in progress. */
  const [rendering, setRendering] = useState(false)
  /**
   * While the image is being generated, nothing that changes its look may change:
   * the format, the view mode and whether roles are shown are locked.
   */
  const locked = format === 'png' && (rendering || busy !== null)

  async function renderPng(node = pngRef.current): Promise<Blob> {
    if (!node) throw new Error('無法產生圖片')
    const { toBlob } = await import('html-to-image')
    const bg = getComputedStyle(document.body).backgroundColor
    const b = await toBlob(node, { pixelRatio: 2, backgroundColor: bg, cacheBust: true })
    if (!b) throw new Error('無法產生圖片')
    return b
  }

  useEffect(() => {
    setReadyPng(null)
    setRendering(false)
    if (!open || !savesToPhotos) return
    let alive = true
    setRendering(true)
    const frame = requestAnimationFrame(() => {
      renderPng()
        .then(
          (b) => alive && setReadyPng(b),
          (e: unknown) => alive && setStatus(e instanceof Error ? e.message : String(e)),
        )
        .finally(() => alive && setRendering(false))
    })
    return () => {
      alive = false
      cancelAnimationFrame(frame)
    }
    // renderPng reads the rendered preview, which depends on these inputs.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [open, savesToPhotos, viewMode, includeRoles, game])

  async function blob(): Promise<Blob> {
    if (format === 'json' || format === 'text') return new Blob([text!], { type: mimeOf(format) })
    if (format === 'qr') return renderPng(qrRef.current)
    return readyPng ?? renderPng()
  }

  async function copyLink() {
    if (!url) return
    const ok = await copyText(url)
    setCopied(ok)
    setStatus(ok ? null : '此瀏覽器無法複製，請長按連結選取')
  }

  function shareLink() {
    if (!url) return
    // Called directly from the tap: Web Share requires a user gesture.
    navigator.share({ title: name, text: `阿瓦隆紀錄：${name}`, url }).catch(() => {})
  }

  function saveToPhotos() {
    if (!readyPng) return
    setStatus(null)
    setBusy('photos')
    // No await before share(): iOS only allows it directly in response to the tap.
    shareFile(new File([readyPng], filename!, { type: 'image/png' }))
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
        downloadBlob(b, filename!)
        setStatus(`已下載 ${filename!}`)
      } else {
        const ok = await shareFile(new File([b], filename!, { type: b.type }), text ?? undefined)
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
        format === 'link' ? (
          <div className="flex gap-2">
            <Button
              variant="primary"
              className="flex-1"
              disabled={!url}
              onClick={() => void copyLink()}
            >
              {copied ? <IconCheck size={20} aria-hidden /> : <IconCopy size={20} aria-hidden />}
              {copied ? '已複製' : '複製連結'}
            </Button>
            {canShare() && (
              <Button disabled={!url} onClick={shareLink} aria-label="用其他 App 分享">
                <IconShare size={20} aria-hidden />
              </Button>
            )}
          </div>
        ) : (
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
                  {!readyPng || busy === 'photos' ? (
                    spinner
                  ) : (
                    <IconPhotoDown size={20} aria-hidden />
                  )}
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
        )
      }
    >
      <div className="space-y-4">
        <fieldset disabled={locked}>
          <legend className="mb-2 text-sm text-subtext0">格式</legend>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map((f) => (
              <label
                key={f}
                className={cx(
                  'flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm has-disabled:cursor-not-allowed has-disabled:opacity-50 has-focus-visible:outline-2 has-focus-visible:outline-accent',
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

        {(format === 'text' || format === 'png') && (
          <div className="space-y-3">
            <Segmented
              label="呈現方式"
              value={viewMode}
              options={VIEW_MODE_OPTIONS}
              onChange={setViewMode}
              disabled={locked}
            />
            <Switch
              label="包含角色"
              checked={includeRoles}
              onChange={setIncludeRoles}
              disabled={locked}
            />
          </div>
        )}
        {locked && (
          <p className="text-xs text-subtext0">圖片產生中，完成後才能調整格式與呈現方式</p>
        )}

        {filename && <p className="truncate text-sm text-subtext0">檔名：{filename}</p>}
        {status && <output className="block text-sm text-subtext1">{status}</output>}

        {sharing ? (
          url ? (
            format === 'link' ? (
              <>
                <textarea
                  readOnly
                  aria-label="分享連結"
                  value={url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-28 w-full rounded-xl border border-overlay0 bg-mantle p-2 font-mono text-xs break-all"
                />
                <p className="text-xs text-subtext0">長度 {url.length} 字元</p>
              </>
            ) : (
              <div ref={qrRef}>
                <QrCode value={url} label={`「${name}」的分享連結 QR code`} />
              </div>
            )
          ) : (
            <div className="flex justify-center py-8">{spinner}</div>
          )
        ) : text !== null ? (
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
