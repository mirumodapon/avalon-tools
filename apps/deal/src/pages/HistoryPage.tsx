import { AppShell, Button, ConfirmSheet, EmptyState, IconButton } from '@avalon/ui'
import { IconChevronRight, IconHistory, IconTrash } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import type { GameRecord } from '../history/records.ts'
import { clearRecords, deleteRecord, listRecords } from '../history/store.ts'
import { configSummary, formatDate } from '../history/summary.ts'
import { navigate } from '../router.ts'

export function HistoryPage() {
  const [records, setRecords] = useState<GameRecord[] | null>(null)
  const [confirm, setConfirm] = useState<GameRecord | 'all' | null>(null)
  const reload = useCallback(() => void listRecords().then(setRecords), [])
  useEffect(reload, [reload])

  return (
    <AppShell title="歷史紀錄" onBack={() => navigate({ name: 'setup' })}>
      <div className="space-y-3 pt-2">
        {records?.length === 0 && (
          <EmptyState icon={<IconHistory size={48} />}>
            <p>還沒有發牌紀錄</p>
          </EmptyState>
        )}
        <ul className="space-y-2">
          {records?.map((r) => (
            <li key={r.id} className="flex items-center gap-1 rounded-2xl bg-mantle">
              <a
                href={`#/history/${encodeURIComponent(r.id)}`}
                className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-2xl p-3 hover:bg-surface0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{formatDate(r.createdAt)}</span>
                  <span className="block truncate text-sm text-subtext0">
                    {r.playerCount} 人・{configSummary(r)}
                  </span>
                </span>
                <IconChevronRight size={20} className="text-overlay1" aria-hidden />
              </a>
              <IconButton label="刪除這筆紀錄" onClick={() => setConfirm(r)}>
                <IconTrash size={20} />
              </IconButton>
            </li>
          ))}
        </ul>
        {records && records.length > 0 && (
          <Button variant="ghost" className="w-full text-fail-fg" onClick={() => setConfirm('all')}>
            清除全部
          </Button>
        )}
      </div>
      <ConfirmSheet
        open={confirm !== null}
        title={confirm === 'all' ? '清除全部紀錄？' : '刪除這筆紀錄？'}
        message={
          confirm === 'all'
            ? `將刪除全部 ${records?.length ?? 0} 筆發牌紀錄，無法復原。`
            : confirm && `${formatDate(confirm.createdAt)} 的紀錄將被刪除，無法復原。`
        }
        confirmLabel="刪除"
        danger
        onConfirm={() => {
          const target = confirm
          void (
            target === 'all' ? clearRecords() : target ? deleteRecord(target.id) : Promise.resolve()
          ).then(reload)
        }}
        onClose={() => setConfirm(null)}
      />
    </AppShell>
  )
}
