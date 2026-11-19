import { dealRoles } from '../deal/shuffle.ts'
import type { GameRecord } from '../history/records.ts'
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
  await saveAndPrune(record, settings.keep)
  useFlow.getState().dispatch({ type: 'start', recordId: record.id, table })
}
