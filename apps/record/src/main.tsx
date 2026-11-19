// oxlint-disable-next-line import/no-unassigned-import -- must run before any other code
import '@avalon/ui/polyfills'
// Must run before any store reads localStorage (moves 1.x settings to the 2.x keys).
// oxlint-disable-next-line import/no-unassigned-import -- evaluated for its side effect, first
import './migration/boot.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { MigrationNotice } from './migration/MigrationNotice.tsx'
import { runMigration } from './migration/run.ts'
import { UpdateGate } from '@avalon/ui'
import { flushPendingSaves, useGames } from './games/store.ts'
import './index.css'
import { requestPersistentStorage } from '@avalon/storage'
import { installZoomGuard } from '@avalon/ui'
import { restoreLastScreen, trackSession } from './session/session.ts'

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

installZoomGuard()
// Reopen the installed app on the screen it was closed on.
restoreLastScreen()
trackSession()
// Games are loaded once the 1.x games (if any) have been copied over.
void runMigration().finally(() => useGames.getState().load())
void requestPersistentStorage()

// Don't lose the last debounced edit when the app is backgrounded or closed.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') void flushPendingSaves()
})
window.addEventListener('pagehide', () => void flushPendingSaves())

createRoot(root).render(
  <StrictMode>
    <UpdateGate>
      <App />
      <MigrationNotice />
    </UpdateGate>
  </StrictMode>,
)
