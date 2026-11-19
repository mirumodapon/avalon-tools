import { cx } from '@avalon/ui'

/** Seat number plates to pick from; `disabled` seats cannot be picked. */
export function SeatPicker({
  count,
  selected,
  disabled = [],
  onToggle,
  label,
}: {
  count: number
  selected: readonly number[]
  disabled?: readonly number[]
  onToggle: (seat: number) => void
  label: string
}) {
  return (
    <fieldset className="grid grid-cols-5 gap-2">
      <legend className="sr-only">{label}</legend>
      {Array.from({ length: count }, (_, i) => i + 1).map((seat) => {
        const on = selected.includes(seat)
        return (
          <button
            key={seat}
            type="button"
            aria-pressed={on}
            aria-label={`${seat} 號`}
            disabled={disabled.includes(seat)}
            onClick={() => onToggle(seat)}
            className={cx(
              'flex aspect-square items-center justify-center rounded-full border text-lg font-semibold tabular-nums disabled:cursor-not-allowed disabled:opacity-30',
              on ? 'border-accent bg-accent text-on-accent' : 'border-surface2 text-text',
            )}
          >
            {seat}
          </button>
        )
      })}
    </fieldset>
  )
}
