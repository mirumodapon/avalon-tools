import { FACTION_LABEL, roleDef, type Faction, type SeatRole } from '@avalon/rules'
import { AppShell, EmptyState, ROLE_ICONS, Segmented, cx, type SegmentOption } from '@avalon/ui'
import { IconFileOff } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { CardBack } from '../components/CardBack.tsx'
import { LADY_MARK, QuestCards, questResultText } from '../components/marks.tsx'
import type { GameRecord } from '../history/records.ts'
import { getRecord } from '../history/store.ts'
import { configSummary, formatDate } from '../history/summary.ts'
import { resultText } from '../quest/quest.ts'
import { navigate } from '../router.ts'
import { useSettings, type RecordView } from '../settings.ts'

const back = () => navigate({ name: 'history' })

const VIEW_OPTIONS: SegmentOption<RecordView>[] = [
  { value: 'seat', label: '依座位' },
  { value: 'faction', label: '依陣營' },
]
const FACTION_TEXT: Record<Faction, string> = { good: 'text-good-fg', evil: 'text-evil-fg' }

/** One plain sheet of seats: number plate, role, and (in seat order) the faction. */
function SeatList({ seats, showFaction = false }: { seats: SeatRole[]; showFaction?: boolean }) {
  return (
    <ul className="divide-y divide-surface0 rounded-2xl bg-mantle">
      {seats.map(({ seat, role }) => {
        const def = roleDef(role)
        const Icon = ROLE_ICONS[role]
        return (
          <li key={seat} className="flex min-h-14 items-center gap-3 px-4">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-surface2 font-semibold text-text tabular-nums"
              aria-label={`${seat} 號`}
            >
              {seat}
            </span>
            <Icon size={20} className={cx('shrink-0', FACTION_TEXT[def.faction])} aria-hidden />
            <span className="min-w-0 flex-1 text-text">{def.name}</span>
            {showFaction && (
              <span className={cx('text-sm', FACTION_TEXT[def.faction])}>
                {FACTION_LABEL[def.faction]}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * One past deal. Identities stay covered until held, and cover again when the page is
 * left or the app goes to the background.
 */
export function RecordPage({ id }: { id: string }) {
  const [record, setRecord] = useState<GameRecord | null | undefined>(undefined)
  const [shown, setShown] = useState(false)
  const view = useSettings((st) => st.settings.recordView)
  const update = useSettings((st) => st.update)

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

  if (record.kind === 'quest') {
    return (
      <AppShell title={formatDate(record.createdAt)} onBack={back}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
          <p className="text-subtext1">{record.size} 人出任務</p>
          <p className={cx('text-4xl font-bold', questResultText(record.fails))}>
            {resultText(record.fails)}
          </p>
          <QuestCards size={record.size} fails={record.fails} />
        </div>
      </AppShell>
    )
  }

  if (record.kind === 'lady') {
    const { label, icon: Icon, text } = LADY_MARK[record.shown]
    return (
      <AppShell title={formatDate(record.createdAt)} onBack={back}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
          {shown ? (
            <>
              <p className="text-subtext1">湖中女神：被查驗的玩家亮出</p>
              <Icon size={64} className={text} aria-hidden />
              <p className={cx('text-4xl font-bold', text)}>{label}</p>
            </>
          ) : (
            <CardBack onReveal={() => setShown(true)} label="長按查看湖中女神的結果" />
          )}
        </div>
      </AppShell>
    )
  }

  const bySeat = record.assignments.toSorted((a, b) => a.seat - b.seat)
  return (
    <AppShell title={formatDate(record.createdAt)} onBack={back}>
      <p className="pt-2 text-sm text-subtext0">
        {record.playerCount} 人・{configSummary(record)}
      </p>
      {shown ? (
        <div className="space-y-4 pt-4">
          <Segmented
            label="呈現方式"
            value={view}
            options={VIEW_OPTIONS}
            onChange={(recordView) => update({ recordView })}
          />
          {view === 'seat' ? (
            <SeatList seats={bySeat} showFaction />
          ) : (
            (['good', 'evil'] as const).map((faction) => {
              const seats = bySeat.filter((a) => roleDef(a.role).faction === faction)
              return (
                <section key={faction} aria-label={FACTION_LABEL[faction]}>
                  <h2 className={cx('mb-2 px-1 text-sm font-semibold', FACTION_TEXT[faction])}>
                    {FACTION_LABEL[faction]}
                    <span className="ml-1.5 font-normal text-subtext0">{seats.length} 人</span>
                  </h2>
                  <SeatList seats={seats} />
                </section>
              )
            })
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-8">
          <CardBack onReveal={() => setShown(true)} label="長按顯示全部身分" />
        </div>
      )}
    </AppShell>
  )
}
