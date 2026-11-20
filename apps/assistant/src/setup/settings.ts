import { defaultSpecialFor, normalizePlayerCount, normalizeSpecial } from '@avalon/pass-play'
import { ladyEnabledByDefault, type InputMode } from '@avalon/record-core'
import type { PlayerCount, RoleId } from '@avalon/rules'
import { readStore, writeStore, type StoreSpec } from '@avalon/storage'
import { create } from 'zustand'
import { key } from '../storage.ts'

/** 傳手機投票 (everyone votes in private, revealed together) or 隊長輸入 (the leader taps). */
export type VoteMode = 'pass' | 'leader'

/** The last game's setup, offered again for the next one. */
export interface SetupSettings {
  playerCount: PlayerCount
  special: RoleId[]
  /** One per seat; empty means "N 號". */
  names: string[]
  voteMode: VoteMode
  /** 隊長輸入 only: 派票 (mark approvers) or 派跳 (mark exceptions), as in the record app. */
  leaderInputMode: InputMode
  lady: boolean
  /** The Lady's first holder, by seat; null = the last seat (the default). */
  ladyHolderSeat: number | null
  /** Draw the Lady's first holder at random instead (ladyHolderSeat is then ignored). */
  ladyHolderRandom: boolean
}

export function normalizeSetup(data: unknown): SetupSettings {
  const d = (typeof data === 'object' && data !== null ? data : {}) as Partial<
    Record<keyof SetupSettings, unknown>
  >
  const playerCount = normalizePlayerCount(d.playerCount)
  const given = Array.isArray(d.names) ? d.names : []
  return {
    playerCount,
    special: d.special === undefined ? defaultSpecialFor(playerCount) : normalizeSpecial(d.special),
    names: Array.from({ length: playerCount }, (_, i) =>
      typeof given[i] === 'string' ? given[i] : '',
    ),
    voteMode: d.voteMode === 'leader' ? 'leader' : 'pass',
    leaderInputMode: d.leaderInputMode === 'anomalies' ? 'anomalies' : 'approvals',
    lady: typeof d.lady === 'boolean' ? d.lady : ladyEnabledByDefault(playerCount),
    ladyHolderSeat:
      Number.isInteger(d.ladyHolderSeat) &&
      (d.ladyHolderSeat as number) >= 1 &&
      (d.ladyHolderSeat as number) <= playerCount
        ? (d.ladyHolderSeat as number)
        : null,
    ladyHolderRandom: d.ladyHolderRandom === true,
  }
}

export const SETUP_STORE: StoreSpec<SetupSettings> = {
  key: key('setup'),
  version: 1,
  parse: normalizeSetup,
  fallback: () => normalizeSetup({}),
}

export const useSetup = create<{
  settings: SetupSettings
  update: (patch: Partial<SetupSettings>) => void
}>()((set, get) => ({
  settings: readStore(SETUP_STORE),
  update: (patch) => {
    const settings = normalizeSetup({ ...get().settings, ...patch })
    writeStore(SETUP_STORE, settings)
    set({ settings })
  },
}))
