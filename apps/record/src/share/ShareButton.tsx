import type { Game } from '@avalon/record-core'
import { IconCheck, IconCopy, IconShare, IconShare2 } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { Sheet } from '@avalon/ui'
import { Button, IconButton, Segmented } from '@avalon/ui'
import { copyText } from '../export/share.ts'
import { useDisplayName } from '../naming/useDisplayName.ts'
import { shareUrl } from './link.ts'
import { QrCode } from './QrCode.tsx'

type View = 'text' | 'qr'

/** Header button that opens the share panel for a game. */
export function ShareButton({ game }: { game: Game }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <IconButton label="分享" onClick={() => setOpen(true)}>
        <IconShare2 size={22} />
      </IconButton>
      <ShareSheet game={game} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

/** Share panel: the game's link as text or QR code, to copy or share. */
export function ShareSheet({
  game,
  open,
  onClose,
}: {
  game: Game
  open: boolean
  onClose: () => void
}) {
  // Mounted only while open, so every opening starts fresh.
  return open ? <ShareSheetContent game={game} onClose={onClose} /> : null
}

function ShareSheetContent({ game, onClose }: { game: Game; onClose: () => void }) {
  const name = useDisplayName(game)
  const [url, setUrl] = useState<string | null>(null)
  const [view, setView] = useState<View>('text')
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    let alive = true
    void shareUrl(game).then((u) => alive && setUrl(u))
    return () => {
      alive = false
    }
  }, [game])

  function share() {
    if (!url) return
    // Called directly from the tap: Web Share requires a user gesture.
    navigator.share({ title: name, text: `阿瓦隆紀錄：${name}`, url }).catch(() => {})
  }

  return (
    <Sheet
      title="分享連結"
      open={url !== null}
      onClose={onClose}
      footer={
        url && (
          <div className="flex gap-2">
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => void copyText(url).then((ok) => setCopied(ok))}
            >
              {copied ? <IconCheck size={20} aria-hidden /> : <IconCopy size={20} aria-hidden />}
              {copied ? '已複製' : '複製連結'}
            </Button>
            {canShare && (
              <Button onClick={share} aria-label="用其他 App 分享">
                <IconShare size={20} aria-hidden />
                分享
              </Button>
            )}
          </div>
        )
      }
    >
      {url && (
        <div className="space-y-3">
          <Segmented
            label="顯示方式"
            value={view}
            options={[
              { value: 'text', label: '文字' },
              { value: 'qr', label: 'QR code' },
            ]}
            onChange={setView}
          />
          {view === 'text' ? (
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
            <QrCode value={url} label={`「${name}」的分享連結 QR code`} />
          )}
          <p className="text-sm text-subtext1">收到連結的人打開後，可以預覽並匯入這場紀錄。</p>
        </div>
      )}
    </Sheet>
  )
}
