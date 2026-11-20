import type { PlayerCount, RoleId } from '@avalon/rules'
import { onStoreChange, readStore, storageKey, writeStore, type StoreSpec } from '@avalon/storage'
import { create } from 'zustand'
import { DEFAULT_SPECIAL, normalizePlayerCount, normalizeSpecial } from '@avalon/pass-play'

export interface Settings {
  playerCount: PlayerCount
  /** Enabled special roles. */
  special: RoleId[]
  /** How a past deal lists its seats: in seat order, or grouped by faction. */
  recordView: RecordView
  tab: DealTab
}

export type RecordView = 'seat' | 'faction'

/** The mode tab last used on the setup page. */
export type DealTab = 'roles' | 'quest' | 'lady'
const TABS: readonly DealTab[] = ['roles', 'quest', 'lady']

export const DEFAULT_SETTINGS: Settings = {
  playerCount: 5,
  special: [...DEFAULT_SPECIAL],
  recordView: 'seat',
  tab: 'roles',
}

export function normalizeSettings(data: unknown): Settings {
  const d = (typeof data === 'object' && data !== null ? data : {}) as Partial<
    Record<keyof Settings, unknown>
  >
  return {
    playerCount: normalizePlayerCount(d.playerCount),
    special: normalizeSpecial(d.special),
    recordView: d.recordView === 'faction' ? 'faction' : 'seat',
    tab: TABS.includes(d.tab as DealTab) ? (d.tab as DealTab) : 'roles',
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
