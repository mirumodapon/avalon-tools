import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import { useState, type ReactNode } from 'react'
import { Sheet } from './Sheet.tsx'
import { cx } from './ui.tsx'

export interface SelectOption<T extends string> {
  value: T
  label: ReactNode
  /** Plain-text label for the trigger's accessible name when `label` is not a string. */
  text?: string
}

/**
 * App-styled replacement for <select>: a field-like button that opens a bottom
 * sheet of options, so it looks and behaves the same on every platform.
 */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  placeholder = '請選擇',
  className,
}: {
  /** Visible label above the field (also used as the sheet title). */
  label: string
  value: T | null
  options: readonly SelectOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)
  const currentText = current ? (current.text ?? String(current.label)) : placeholder

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-label={`${label}：${currentText}`}
        onClick={() => setOpen(true)}
        className={cx(
          'flex min-h-11 w-full items-center gap-2 rounded-xl border border-overlay0 bg-base px-3 text-left disabled:opacity-40',
          className,
        )}
      >
        <span className={cx('min-w-0 flex-1 truncate', !current && 'text-overlay1')}>
          {current ? current.label : placeholder}
        </span>
        <IconChevronDown size={18} className="shrink-0 text-subtext0" aria-hidden />
      </button>
      <Sheet title={label} open={open} onClose={() => setOpen(false)}>
        <ul className="space-y-1">
          {options.map((o) => {
            const selected = o.value === value
            return (
              <li key={o.value}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={cx(
                    'flex min-h-12 w-full items-center gap-2 rounded-xl px-3 text-left',
                    selected ? 'bg-accent/15 font-semibold' : 'hover:bg-surface0',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {selected && (
                    <IconCheck size={18} className="shrink-0 text-accent-fg" aria-hidden />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </Sheet>
    </>
  )
}

/** Label + Select, matching TextField's layout. */
export function SelectField<T extends string>(props: Parameters<typeof Select<T>>[0]) {
  return (
    <div>
      <p className="mb-1 block text-sm text-subtext0" aria-hidden>
        {props.label}
      </p>
      <Select {...props} />
    </div>
  )
}
