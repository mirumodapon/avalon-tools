import { IconDatabase, IconLock, IconLockOpen } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useGames } from '../games/store.ts'
import {
  formatBytes,
  getStorageInfo,
  requestPersistentStorage,
  type StorageInfo,
} from '../storage/persist.ts'
import { Button } from './ui.tsx'

/** Shows storage usage and whether the browser granted persistent storage. */
export function StorageStatus() {
  const count = useGames((s) => s.games.length)
  const [info, setInfo] = useState<StorageInfo | null>(null)

  // Re-measure usage whenever the number of stored games changes.
  // oxlint-disable-next-line react/exhaustive-effect-dependencies
  useEffect(() => {
    let alive = true
    void getStorageInfo().then((i) => alive && setInfo(i))
    return () => {
      alive = false
    }
  }, [count])

  async function request() {
    await requestPersistentStorage()
    setInfo(await getStorageInfo())
  }

  return (
    <div className="space-y-2 text-sm">
      <p className="flex items-center gap-2">
        <IconDatabase size={18} className="text-subtext0" aria-hidden />
        已存 {count} 場遊戲
        {info?.usage != null && (
          <span className="text-subtext0">
            ・使用 {formatBytes(info.usage)}
            {info.quota != null && ` / ${formatBytes(info.quota)}`}
          </span>
        )}
      </p>
      <p className="flex items-center gap-2">
        {info?.persisted ? (
          <>
            <IconLock size={18} className="text-success-fg" aria-hidden />
            已取得持久保存，瀏覽器不會自動清除資料
          </>
        ) : (
          <>
            <IconLockOpen size={18} className="text-forced-fg" aria-hidden />
            {info?.persisted === false
              ? '尚未取得持久保存，空間不足時瀏覽器可能清除資料'
              : '此瀏覽器不支援持久保存查詢'}
          </>
        )}
      </p>
      {info?.persisted === false && (
        <Button variant="ghost" className="min-h-9 px-2 text-sm" onClick={() => void request()}>
          申請持久保存（安裝到主畫面後較容易取得）
        </Button>
      )}
    </div>
  )
}
