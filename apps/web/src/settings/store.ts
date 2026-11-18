import type { ThemeSettings } from '@avalon/theme'
import { create } from 'zustand'
import { readStore, writeStore } from '../storage/storage.ts'
import { DEFAULT_SETTINGS, SETTINGS_STORE, type Settings } from './settings.ts'

interface SettingsState {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  updateTheme: (patch: Partial<ThemeSettings>) => void
  reset: () => void
}

export const useSettings = create<SettingsState>()((set, get) => ({
  settings: readStore(SETTINGS_STORE),
  update: (patch) => set({ settings: { ...get().settings, ...patch } }),
  updateTheme: (patch) =>
    set({ settings: { ...get().settings, theme: { ...get().settings.theme, ...patch } } }),
  reset: () => set({ settings: DEFAULT_SETTINGS }),
}))

useSettings.subscribe((state, prev) => {
  if (state.settings !== prev.settings) writeStore(SETTINGS_STORE, state.settings)
})
