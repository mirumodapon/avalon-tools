/**
 * Imported first by main.tsx: moves 1.x settings into the 2.x keys before the
 * settings and theme stores read them. Games follow asynchronously (see run.ts).
 */
import { reloadGlobalTheme } from '@avalon/ui'
import { migrateLocalFromV1 } from './fromV1.ts'

try {
  migrateLocalFromV1()
  reloadGlobalTheme()
} catch {
  // Never block startup; the full migration retries and reports failures.
}
