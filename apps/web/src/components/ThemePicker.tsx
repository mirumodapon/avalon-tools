import { ACCENT_NAMES, THEME_MODE_LABELS, THEME_MODES } from '@avalon/theme'
import { IconCheck } from '@tabler/icons-react'
import { useSettings } from '../settings/store.ts'
import { Segmented } from './ui.tsx'

export function ThemePicker() {
  const theme = useSettings((s) => s.settings.theme)
  const updateTheme = useSettings((s) => s.updateTheme)

  return (
    <div className="space-y-4">
      <div>
        <Segmented
          label="主題"
          value={theme.mode}
          options={THEME_MODES.map((m) => ({ value: m, label: THEME_MODE_LABELS[m] }))}
          onChange={(mode) => updateTheme({ mode })}
        />
        <p className="mt-2 text-xs text-subtext0">淺色為 Catppuccin Latte，深色為 Macchiato</p>
      </div>

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
