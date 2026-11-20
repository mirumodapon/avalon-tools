import { IconCards } from '@tabler/icons-react'
import { HOLD_MS, useHold } from './useHold.ts'

const R = 46
const CIRCUMFERENCE = 2 * Math.PI * R

/** Face-down card: hold to turn it over. The ring shows progress; no seconds are shown. */
export function CardBack({
  onReveal,
  label = '長按查看身分',
}: {
  onReveal: () => void
  label?: string
}) {
  const { holding, handlers } = useHold(onReveal)
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        aria-label={label}
        {...handlers}
        className="no-select relative flex aspect-[3/4] w-60 touch-none items-center justify-center rounded-3xl border-2 border-surface2 bg-mantle shadow-lg"
      >
        <svg viewBox="0 0 100 100" className="absolute size-40 -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={R} fill="none" strokeWidth="4" className="stroke-surface1" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            className="stroke-accent"
            strokeDasharray={CIRCUMFERENCE}
            style={{
              strokeDashoffset: holding ? 0 : CIRCUMFERENCE,
              transition: holding ? `stroke-dashoffset ${HOLD_MS}ms linear` : 'none',
            }}
          />
        </svg>
        <IconCards size={64} className="text-accent-fg" aria-hidden />
      </button>
      <p className="text-lg text-subtext1">{label}</p>
    </div>
  )
}
