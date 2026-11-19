import { roleDef } from '@avalon/rules'
import { AppShell, Button, ConfirmSheet, EmptyState, IconButton, RoleIcon, cx } from '@avalon/ui'
import { IconEye, IconHistory, IconPlayerPlay, IconTrash, IconUsers } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import { startReplay } from '../flow/start.ts'
import { MAX_RECORDS, type GameRecord } from '../history/records.ts'
import { clearRecords, deleteRecord, listRecords } from '../history/store.ts'
import { formatDate, formatWhen } from '../history/summary.ts'
import { navigate } from '../router.ts'

const toSetup = () => navigate({ name: 'setup' })

function RecordItem({ record, onDelete }: { record: GameRecord; onDelete: () => void }) {
  const { day, time } = formatWhen(record.createdAt)
  return (
    <li className="rounded-2xl bg-mantle p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">
            {day}
            <span className="ml-2 font-normal text-subtext1 tabular-nums">{time}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-subtext0">
            <IconUsers size={16} aria-hidden />
            {record.playerCount} 人
          </p>
        </div>
        <IconButton label="刪除這筆紀錄" onClick={onDelete}>
          <IconTrash size={20} className="text-overlay1" />
        </IconButton>
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="特殊角色">
        {record.config.length === 0 ? (
          <li className="rounded-full bg-surface0 px-2.5 py-1 text-xs text-subtext1">
            只有忠臣與爪牙
          </li>
        ) : (
          record.config.map((id) => (
            <li
              key={id}
              className={cx(
                'rounded-full px-2.5 py-1 text-xs',
                roleDef(id).faction === 'good' ? 'bg-good/15' : 'bg-evil/15',
              )}
            >
              <RoleIcon role={id} size={14} showName />
            </li>
          ))
        )}
      </ul>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button onClick={() => navigate({ name: 'record', id: record.id })}>
          <IconEye size={20} aria-hidden />
          檢視
        </Button>
        <Button onClick={() => startReplay(record)}>
          <IconPlayerPlay size={20} aria-hidden />
          回放
        </Button>
      </div>
    </li>
  )
}

/** Saved deals: 檢視 shows every seat at once, 回放 passes the phone around again. */
export function HistoryPage() {
  const [records, setRecords] = useState<GameRecord[] | null>(null)
  const [confirm, setConfirm] = useState<GameRecord | 'all' | null>(null)
  const reload = useCallback(() => void listRecords().then(setRecords), [])
  useEffect(reload, [reload])

  return (
    <AppShell title="歷史紀錄" onBack={toSetup}>
      {records?.length === 0 ? (
        <EmptyState icon={<IconHistory size={48} />}>
          <p>還沒有發牌紀錄</p>
        </EmptyState>
      ) : (
        <div className="space-y-3 pt-2">
          <p className="text-sm text-subtext0">保留最近 {MAX_RECORDS} 筆，較舊的會自動刪除</p>
          <ul className="space-y-3">
            {records?.map((r) => (
              <RecordItem key={r.id} record={r} onDelete={() => setConfirm(r)} />
            ))}
          </ul>
          {records && records.length > 1 && (
            <button
              type="button"
              className="mx-auto block min-h-11 px-4 text-sm text-fail-fg"
              onClick={() => setConfirm('all')}
            >
              清除全部紀錄
            </button>
          )}
        </div>
      )}
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
          const done =
            target === 'all' ? clearRecords() : target ? deleteRecord(target.id) : Promise.resolve()
          void done.then(reload)
        }}
        onClose={() => setConfirm(null)}
      />
    </AppShell>
  )
}
