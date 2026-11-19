import { dealRoles } from '../deal/shuffle.ts'
import { MAX_RECORDS, type GameRecord } from '../history/records.ts'
import { saveAndPrune } from '../history/store.ts'
import { rolesInPlay } from '../roles/config.ts'
import type { Settings } from '../settings.ts'
import { useFlow } from './store.ts'

/** Deals, saves the record (pruning old ones), then starts passing the phone. */
export async function startDeal(settings: Settings): Promise<void> {
  const table = dealRoles(rolesInPlay(settings))
  const record: GameRecord = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    playerCount: settings.playerCount,
    config: [...settings.special],
    assignments: table,
  }
  await saveAndPrune(record, MAX_RECORDS)
  useFlow.getState().dispatch({ type: 'start', mode: 'deal', recordId: record.id, table })
}

/** Passes the phone around again with a saved deal; nothing new is saved. */
export function startReplay(record: GameRecord): void {
  const table = record.assignments.toSorted((a, b) => a.seat - b.seat)
  useFlow.getState().dispatch({ type: 'start', mode: 'replay', recordId: record.id, table })
}
