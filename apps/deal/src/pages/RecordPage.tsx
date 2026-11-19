import { FACTION_LABEL, roleDef } from '@avalon/rules'
import { AppShell, EmptyState, RoleIcon, cx } from '@avalon/ui'
import { IconFileOff } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { CardBack } from '../components/CardBack.tsx'
import type { GameRecord } from '../history/records.ts'
import { getRecord } from '../history/store.ts'
import { configSummary, formatDate } from '../history/summary.ts'
import { navigate } from '../router.ts'

const back = () => navigate({ name: 'history' })

/** One past deal. Identities stay covered until held, and cover again when the page is left. */
export function RecordPage({ id }: { id: string }) {
  const [record, setRecord] = useState<GameRecord | null | undefined>(undefined)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    let alive = true
    void getRecord(id).then((r) => alive && setRecord(r ?? null))
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    const hide = () => document.visibilityState === 'hidden' && setShown(false)
    document.addEventListener('visibilitychange', hide)
    return () => document.removeEventListener('visibilitychange', hide)
  }, [])

  if (record === undefined)
    return (
      <AppShell title="發牌紀錄" onBack={back}>
        {null}
      </AppShell>
    )
  if (record === null) {
    return (
      <AppShell title="發牌紀錄" onBack={back}>
        <EmptyState icon={<IconFileOff size={48} />}>
          <p>找不到這筆紀錄</p>
        </EmptyState>
      </AppShell>
    )
  }

  return (
    <AppShell title={formatDate(record.createdAt)} onBack={back}>
      <p className="pt-2 text-sm text-subtext0">
        {record.playerCount} 人・{configSummary(record)}
      </p>
      {shown ? (
        <div className="space-y-4 pt-4">
          {(['good', 'evil'] as const).map((faction) => (
            <section key={faction} aria-label={FACTION_LABEL[faction]}>
              <h2
                className={cx(
                  'mb-2 font-semibold',
                  faction === 'good' ? 'text-good-fg' : 'text-evil-fg',
                )}
              >
                {FACTION_LABEL[faction]}
              </h2>
              <ul className="space-y-2">
                {record.assignments
                  .filter((a) => roleDef(a.role).faction === faction)
                  .toSorted((a, b) => a.seat - b.seat)
                  .map((a) => (
                    <li
                      key={a.seat}
                      className={cx(
                        'flex min-h-12 items-center gap-3 rounded-xl border-l-4 bg-mantle px-3',
                        faction === 'good' ? 'border-good' : 'border-evil',
                      )}
                    >
                      <span className="w-12 font-mono text-lg font-bold">{a.seat} 號</span>
                      <RoleIcon role={a.role} size={20} showName />
                    </li>
                  ))}
              </ul>
            </section>
          ))}
          <button
            type="button"
            className="w-full py-3 text-subtext0"
            onClick={() => setShown(false)}
          >
            遮蔽身分
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-8">
          <CardBack onReveal={() => setShown(true)} label="長按顯示全部身分" />
        </div>
      )}
    </AppShell>
  )
}
