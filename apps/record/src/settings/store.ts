import { create } from 'zustand'
import { DEFAULT_SETTINGS, readSettings, writeSettings, type Settings } from './settings.ts'

interface SettingsState {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  reset: () => void
}

export const useSettings = create<SettingsState>()((set, get) => ({
  settings: readSettings(),
  update: (patch) => set({ settings: { ...get().settings, ...patch } }),
  reset: () => set({ settings: DEFAULT_SETTINGS }),
}))

useSettings.subscribe((state, prev) => {
  if (state.settings !== prev.settings) writeSettings(state.settings, prev.settings)
})
