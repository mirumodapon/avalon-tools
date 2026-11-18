import { storageKey } from '@avalon/storage'
import { toolById } from '@avalon/registry'
import { Button, Card } from '@avalon/ui'
import { IconSparkles } from '@tabler/icons-react'
import { useState } from 'react'
import { isStandalone } from './standalone.ts'

export const UPGRADE_NOTICE_KEY = storageKey('home', 'upgradeNotice')

/** Any key written by 1.x means this device used the old 阿瓦隆紀錄. */
function usedV1(): boolean {
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i)?.startsWith('avalon-recorder:')) return true
  }
  return false
}

function shouldShow(): boolean {
  try {
    return isStandalone() && usedV1() && localStorage.getItem(UPGRADE_NOTICE_KEY) === null
  } catch {
    return false
  }
}

/**
 * Installed 1.x apps update in place into this home. Explain once where the
 * records went; the record tool itself moves the data on first open.
 */
export function UpgradeCard() {
  const [open, setOpen] = useState(shouldShow)
  if (!open) return null
  const record = toolById('record')

  function dismiss() {
    try {
      localStorage.setItem(UPGRADE_NOTICE_KEY, '2.0.0')
    } catch {
      // can't remember it: the card simply shows again next time
    }
    setOpen(false)
  }

  return (
    <Card className="space-y-3 border border-accent/40">
      <p className="flex items-center gap-2 font-semibold">
        <IconSparkles size={20} className="text-accent-fg" aria-hidden />
        阿瓦隆紀錄升級為阿瓦隆工具集
      </p>
      <div className="space-y-1 text-sm text-subtext1">
        <p>原本的紀錄功能現在是「{record.name}」工具，所有紀錄與設定都會保留並自動搬過去。</p>
        <p>也可以打開「{record.name}」後把它另外加入主畫面。</p>
      </div>
      <div className="flex gap-2">
        <a
          href={record.path}
          onClick={dismiss}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-accent px-4 font-semibold text-on-accent"
        >
          打開{record.name}
        </a>
        <Button variant="ghost" onClick={dismiss}>
          知道了
        </Button>
      </div>
    </Card>
  )
}
