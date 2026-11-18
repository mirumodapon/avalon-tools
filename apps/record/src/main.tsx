import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
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
void useGames.getState().load()
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
    </UpdateGate>
  </StrictMode>,
)
