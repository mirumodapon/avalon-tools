import { IconRefresh, IconX } from '@tabler/icons-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button, IconButton } from './ui.tsx'

/** Offers to load a new version when one is waiting. (No "ready offline" notice.) */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null
  return (
    <output className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+0.5rem)] z-50 mx-auto flex max-w-md items-center gap-2 rounded-2xl border border-accent bg-mantle p-3 shadow-lg">
      <span className="flex-1 text-sm">有新版本可用</span>
      <Button variant="primary" className="min-h-9" onClick={() => void updateServiceWorker(true)}>
        <IconRefresh size={18} aria-hidden />
        更新
      </Button>
      <IconButton label="關閉" onClick={() => setNeedRefresh(false)} className="size-9">
        <IconX size={18} />
      </IconButton>
    </output>
  )
}
