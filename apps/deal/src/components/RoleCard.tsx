import { FACTION_LABEL, roleDef, visionFor, type SeatRole } from '@avalon/rules'
import { cx, ROLE_ICONS } from '@avalon/ui'
import { useEffect, useRef } from 'react'
import { ABILITY, EXTRA, visionText } from '../roles/text.ts'

/** Taps right after the card turns over are the hold being released, not a tap. */
export const IGNORE_TAPS_MS = 500
export const DOUBLE_TAP_MS = 300

/**
 * The face-up card of one player. Double tap to turn it face down. It is a button so
 * the zoom guard lets quick taps through.
 */
export function RoleCard({
  self,
  table,
  onCover,
}: {
  self: SeatRole
  table: readonly SeatRole[]
  onCover: () => void
}) {
  const def = roleDef(self.role)
  const Icon = ROLE_ICONS[self.role]
  const good = def.faction === 'good'
  const shownAt = useRef(0)
  const lastTap = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])

  function tap() {
    const now = performance.now()
    if (now - shownAt.current < IGNORE_TAPS_MS) return
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0
      onCover()
    } else {
      lastTap.current = now
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        aria-label={`${def.name}，雙擊蓋牌`}
        onClick={tap}
        onContextMenu={(e) => e.preventDefault()}
        className={cx(
          'no-select animate-flip-in flex aspect-[3/4] w-64 flex-col items-center justify-center gap-3 rounded-3xl border-4 bg-mantle p-5 text-center shadow-lg',
          good ? 'border-good' : 'border-evil',
        )}
      >
        <span className={cx('text-sm font-semibold', good ? 'text-good-fg' : 'text-evil-fg')}>
          {FACTION_LABEL[def.faction]}
        </span>
        <Icon size={64} className={good ? 'text-good-fg' : 'text-evil-fg'} aria-hidden />
        <span className="text-2xl font-bold">{def.name}</span>
        <span className="text-base font-semibold text-text">
          {visionText(visionFor(self, table))}
        </span>
        {EXTRA[self.role] && <span className="text-sm text-evil-fg">{EXTRA[self.role]}</span>}
        <span className="text-sm text-subtext0">{ABILITY[self.role]}</span>
      </button>
      <p className="text-lg text-subtext1">確認後雙擊卡片蓋牌</p>
    </div>
  )
}
