import { cx } from '@avalon/ui'
import type { ReactNode } from 'react'

export interface TabOption<T extends string> {
  value: T
  label: ReactNode
}

export const tabId = (value: string) => `tab-${value}`
export const panelId = (value: string) => `panel-${value}`

/** Tabs that switch between independent modes; the panel uses `panelId(value)`. */
export function ModeTabs<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: readonly TabOption<T>[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="mx-4 mb-2 flex rounded-xl bg-surface0 p-1">
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            id={tabId(o.value)}
            aria-selected={selected}
            aria-controls={panelId(o.value)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cx(
              'flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-sm',
              selected ? 'bg-base font-semibold text-text shadow-sm' : 'text-subtext0',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
