import type { PlayerCount, RoleId } from '@avalon/rules'
import { onStoreChange, readStore, storageKey, writeStore, type StoreSpec } from '@avalon/storage'
import { create } from 'zustand'
import { DEFAULT_SPECIAL, normalizePlayerCount, normalizeSpecial } from './roles/config.ts'

export interface Settings {
  playerCount: PlayerCount
  /** Enabled special roles. */
  special: RoleId[]
}

export const DEFAULT_SETTINGS: Settings = {
  playerCount: 5,
  special: [...DEFAULT_SPECIAL],
}

export function normalizeSettings(data: unknown): Settings {
  const d = (typeof data === 'object' && data !== null ? data : {}) as Partial<
    Record<keyof Settings, unknown>
  >
  return {
    playerCount: normalizePlayerCount(d.playerCount),
    special: normalizeSpecial(d.special),
  }
}

export const SETTINGS_STORE: StoreSpec<Settings> = {
  key: storageKey('deal', 'settings'),
  version: 1,
  parse: normalizeSettings,
  fallback: () => ({ ...DEFAULT_SETTINGS, special: [...DEFAULT_SETTINGS.special] }),
}

interface SettingsState {
  settings: Settings
  update: (patch: Partial<Settings>) => void
}

export const useSettings = create<SettingsState>()((set, get) => ({
  settings: readStore(SETTINGS_STORE),
  update: (patch) => {
    const settings = normalizeSettings({ ...get().settings, ...patch })
    writeStore(SETTINGS_STORE, settings)
    set({ settings })
  },
}))

// Another tab of this app changed the settings.
onStoreChange(SETTINGS_STORE.key, () =>
  useSettings.setState({ settings: readStore(SETTINGS_STORE) }),
)
