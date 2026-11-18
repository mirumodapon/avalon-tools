import { migrateFromV1, type MigrationResult } from './fromV1.ts'

let running: Promise<MigrationResult> | null = null

/** Starts the 1.x upgrade once per page load; every caller gets the same result. */
export function runMigration(): Promise<MigrationResult> {
  running ??= migrateFromV1().catch((e: unknown): MigrationResult => ({
    status: 'failed',
    error: String(e),
  }))
  return running
}
