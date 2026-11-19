import { MAX_RECORDS, type GameRecord, type LadyRecord, type QuestRecord } from './records.ts'
import { saveAndPrune } from './store.ts'

type Payload = Omit<QuestRecord, 'id' | 'createdAt'> | Omit<LadyRecord, 'id' | 'createdAt'>

/** Saves a finished quest or Lady use to the history (newest 50 kept). */
export function recordResult(payload: Payload): Promise<void> {
  const record = { id: crypto.randomUUID(), createdAt: Date.now(), ...payload } as GameRecord
  return saveAndPrune(record, MAX_RECORDS).catch(() => {
    // The history is a convenience: a failed save must not interrupt the game.
  })
}
