import type { Game } from '@avalon/core'
import { IconCheck, IconCopy, IconShare2 } from '@tabler/icons-react'
import { useState } from 'react'
import { Sheet } from '../components/Sheet.tsx'
import { Button, IconButton } from '../components/ui.tsx'
import { copyText } from '../export/share.ts'
import { useDisplayName } from '../naming/useDisplayName.ts'
import { shareUrl } from './link.ts'

/** Shares a link that carries the whole game; falls back to a copyable link. */
export function ShareButton({ game }: { game: Game }) {
  const name = useDisplayName(game)
  const [url, setUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function share() {
    const link = await shareUrl(game)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: name, text: `阿瓦隆紀錄：${name}`, url: link })
        return
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
      }
    }
    setCopied(false)
    setUrl(link)
  }

  return (
    <>
      <IconButton label="分享" onClick={() => void share()}>
        <IconShare2 size={22} />
      </IconButton>
      <Sheet title="分享連結" open={url !== null} onClose={() => setUrl(null)}>
        {url && (
          <div className="space-y-3">
            <p className="text-sm text-subtext1">收到連結的人打開後，可以預覽並匯入這場紀錄。</p>
            <textarea
              readOnly
              aria-label="分享連結"
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="h-28 w-full rounded-xl border border-overlay0 bg-mantle p-2 font-mono text-xs break-all"
            />
            <p className="text-xs text-subtext0">長度 {url.length} 字元</p>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => void copyText(url).then((ok) => setCopied(ok))}
            >
              {copied ? <IconCheck size={20} aria-hidden /> : <IconCopy size={20} aria-hidden />}
              {copied ? '已複製' : '複製連結'}
            </Button>
          </div>
        )}
      </Sheet>
    </>
  )
}
