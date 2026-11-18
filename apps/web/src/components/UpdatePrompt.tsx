import { IconRefresh, IconCircleCheck, IconX } from '@tabler/icons-react'
import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button, IconButton } from './ui.tsx'

/** Notifies when the app is ready offline, and when a new version can be loaded. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  // The offline notice is informational; hide it on its own so it never lingers.
  useEffect(() => {
    if (!offlineReady) return
    const t = setTimeout(() => setOfflineReady(false), 4000)
    return () => clearTimeout(t)
  }, [offlineReady, setOfflineReady])

  if (!needRefresh && !offlineReady) return null
  const close = () => {
    setNeedRefresh(false)
    setOfflineReady(false)
  }
  return (
    <output className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+0.5rem)] z-50 mx-auto flex max-w-md items-center gap-2 rounded-2xl border border-accent bg-mantle p-3 shadow-lg">
      {needRefresh ? (
        <>
          <span className="flex-1 text-sm">有新版本可用</span>
          <Button
            variant="primary"
            className="min-h-9"
            onClick={() => void updateServiceWorker(true)}
          >
            <IconRefresh size={18} aria-hidden />
            更新
          </Button>
        </>
      ) : (
        <span className="flex flex-1 items-center gap-1 text-sm">
          <IconCircleCheck size={18} aria-hidden />
          已可離線使用
        </span>
      )}
      <IconButton label="關閉" onClick={close} className="size-9">
        <IconX size={18} />
      </IconButton>
    </output>
  )
}
