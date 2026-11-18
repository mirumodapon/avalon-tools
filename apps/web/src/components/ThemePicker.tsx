import { ACCENT_NAMES, FLAVOR_LABELS, FLAVOR_NAMES, type FlavorPreference } from '@avalon/theme'
import { IconCheck, IconDeviceDesktop } from '@tabler/icons-react'
import { useSettings } from '../settings/store.ts'

const FLAVOR_OPTIONS: { value: FlavorPreference; label: string }[] = [
  { value: 'system', label: '跟隨系統' },
  ...FLAVOR_NAMES.map((f) => ({ value: f, label: FLAVOR_LABELS[f] })),
]

export function ThemePicker() {
  const theme = useSettings((s) => s.settings.theme)
  const updateTheme = useSettings((s) => s.updateTheme)

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm text-subtext0">風味</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FLAVOR_OPTIONS.map((o) => (
            <label
              key={o.value}
              data-flavor={o.value === 'system' ? undefined : o.value}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-overlay0 bg-base px-3 text-text has-checked:border-accent has-checked:ring-2 has-checked:ring-accent"
            >
              <input
                type="radio"
                name="flavor"
                className="sr-only"
                checked={theme.flavor === o.value}
                onChange={() => updateTheme({ flavor: o.value })}
              />
              {o.value === 'system' && <IconDeviceDesktop size={18} aria-hidden />}
              {o.value !== 'system' && (
                <span className="flex gap-0.5" aria-hidden>
                  <span className="size-3 rounded-full bg-red" />
                  <span className="size-3 rounded-full bg-green" />
                  <span className="size-3 rounded-full bg-blue" />
                </span>
              )}
              {o.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-subtext0">跟隨系統：淺色使用 Latte，深色使用 Macchiato</p>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-subtext0">強調色</legend>
        <div className="grid grid-cols-7 gap-2">
          {ACCENT_NAMES.map((a) => (
            <label
              key={a}
              title={a}
              data-accent={a}
              className="relative flex aspect-square min-h-11 cursor-pointer items-center justify-center rounded-full bg-accent text-on-accent has-checked:ring-2 has-checked:ring-text has-checked:ring-offset-2 has-checked:ring-offset-base"
            >
              <input
                type="radio"
                name="accent"
                className="sr-only"
                aria-label={a}
                checked={theme.accent === a}
                onChange={() => updateTheme({ accent: a })}
              />
              {theme.accent === a && <IconCheck size={18} aria-hidden />}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
