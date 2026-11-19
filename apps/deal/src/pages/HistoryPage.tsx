import { roleDef } from '@avalon/rules'
import { AppShell, Button, ConfirmSheet, EmptyState, IconButton, RoleIcon, cx } from '@avalon/ui'
import {
  IconEye,
  IconFlag,
  IconHistory,
  IconPlayCard,
  IconPlayerPlay,
  IconRipple,
  IconTrash,
  type Icon,
} from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import { startReplay } from '../flow/start.ts'
import { QuestCards, questResultText } from '../components/marks.tsx'
import {
  MAX_RECORDS,
  type GameRecord,
  type LadyRecord,
  type QuestRecord,
  type RolesRecord,
} from '../history/records.ts'
import { clearRecords, deleteRecord, listRecords } from '../history/store.ts'
import { formatDate, formatWhen } from '../history/summary.ts'
import { resultText } from '../quest/quest.ts'
import { navigate } from '../router.ts'

const toSetup = () => navigate({ name: 'setup' })

const KIND: Record<GameRecord['kind'], { label: string; icon: Icon }> = {
  roles: { label: '發角色', icon: IconPlayCard },
  quest: { label: '出任務', icon: IconFlag },
  lady: { label: '湖中女神', icon: IconRipple },
}

function RolesBody({ record }: { record: RolesRecord }) {
  return (
    <>
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
    </>
  )
}

function QuestBody({ record }: { record: QuestRecord }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <QuestCards size={record.size} fails={record.fails} cards={record.cards} small />
      <span className={cx('font-semibold', questResultText(record.fails))}>
        {resultText(record.fails)}
      </span>
    </div>
  )
}

function LadyBody({ record }: { record: LadyRecord }) {
  return (
    <Button className="mt-4 w-full" onClick={() => navigate({ name: 'record', id: record.id })}>
      <IconEye size={20} aria-hidden />
      檢視
    </Button>
  )
}

function subtitle(record: GameRecord): string {
  switch (record.kind) {
    case 'roles':
      return `${record.playerCount} 人`
    case 'quest':
      return `${record.size} 人出任務`
    case 'lady':
      return '只有持有者看過結果'
  }
}

function RecordItem({ record, onDelete }: { record: GameRecord; onDelete: () => void }) {
  const { day, time } = formatWhen(record.createdAt)
  const { label, icon: KindIcon } = KIND[record.kind]
  return (
    <li className="rounded-2xl bg-mantle p-4">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface0 text-subtext1"
          aria-hidden
        >
          <KindIcon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {label}
            <span className="ml-2 font-normal text-subtext1 tabular-nums">
              {day} {time}
            </span>
          </p>
          <p className="mt-0.5 text-sm text-subtext0">{subtitle(record)}</p>
        </div>
        <IconButton label="刪除這筆紀錄" onClick={onDelete}>
          <IconTrash size={20} className="text-overlay1" />
        </IconButton>
      </div>
      {record.kind === 'roles' && <RolesBody record={record} />}
      {record.kind === 'quest' && <QuestBody record={record} />}
      {record.kind === 'lady' && <LadyBody record={record} />}
    </li>
  )
}

/**
 * Everything the three modes saved, newest first. A deal can be shown (檢視) or passed
 * around again (回放); a quest shows its result; a Lady result stays covered until held.
 */
export function HistoryPage() {
  const [records, setRecords] = useState<GameRecord[] | null>(null)
  const [confirm, setConfirm] = useState<GameRecord | 'all' | null>(null)
  const reload = useCallback(() => void listRecords().then(setRecords), [])
  useEffect(reload, [reload])

  return (
    <AppShell title="歷史紀錄" onBack={toSetup}>
      {records?.length === 0 ? (
        <EmptyState icon={<IconHistory size={48} />}>
          <p>還沒有任何紀錄</p>
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
            ? `將刪除全部 ${records?.length ?? 0} 筆紀錄，無法復原。`
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
