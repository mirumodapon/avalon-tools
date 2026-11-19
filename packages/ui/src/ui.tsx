import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent font-semibold disabled:opacity-40',
  secondary: 'bg-surface0 text-text hover:bg-surface1 disabled:opacity-40',
  danger: 'bg-fail text-on-fill font-semibold disabled:opacity-40',
  ghost: 'text-subtext1 hover:bg-surface0 disabled:opacity-40',
}

export function Button({
  variant = 'secondary',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-4 transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}

export function IconButton({
  label,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-subtext1 hover:bg-surface0 disabled:opacity-30',
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx('rounded-2xl bg-mantle p-4', className)}>{children}</section>
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex min-h-8 items-center justify-between gap-2">
      <h2 className="text-sm font-semibold tracking-wide text-subtext0">{children}</h2>
      {action}
    </div>
  )
}

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
  disabled = false,
}: {
  value: T
  options: readonly SegmentOption<T>[]
  onChange: (value: T) => void
  label: string
  className?: string
  disabled?: boolean
}) {
  const name = useId()
  return (
    <fieldset
      disabled={disabled}
      className={cx('flex rounded-xl bg-surface0 p-1 disabled:opacity-50', className)}
    >
      <legend className="sr-only">{label}</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className={cx(
            'flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 text-sm has-disabled:cursor-not-allowed has-focus-visible:outline-2 has-focus-visible:outline-accent',
            value === o.value ? 'bg-base font-semibold text-text shadow-sm' : 'text-subtext0',
          )}
        >
          <input
            type="radio"
            name={name}
            className="sr-only"
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 has-disabled:cursor-not-allowed has-disabled:opacity-50">
      <span>
        <span className="block">{label}</span>
        {description && <span className="block text-sm text-subtext0">{description}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-surface2 transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-base after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  multiline,
  maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: ReactNode
  multiline?: boolean
  maxLength?: number
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const cls =
    'w-full rounded-xl border border-overlay0 bg-base px-3 py-2.5 text-text placeholder:text-overlay1 focus:border-accent focus:outline-none'
  const common = {
    id,
    value,
    placeholder,
    maxLength,
    'aria-describedby': hint ? hintId : undefined,
  }
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-subtext0">
        {label}
      </label>
      {multiline ? (
        <textarea
          {...common}
          className={cx(cls, 'min-h-24')}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          {...common}
          className={cx(cls, 'min-h-11')}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-subtext0">
          {hint}
        </p>
      )}
    </div>
  )
}

/** Sticky action area at the bottom of the screen, within thumb reach. */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-4 border-t border-surface0 bg-base/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
      {children}
    </div>
  )
}

export function EmptyState({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-subtext0">
      <span aria-hidden className="text-overlay1">
        {icon}
      </span>
      {children}
    </div>
  )
}
