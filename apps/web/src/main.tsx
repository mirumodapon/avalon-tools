import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { flushPendingSaves, useGames } from './games/store.ts'
import './index.css'
import { requestPersistentStorage } from './storage/persist.ts'
import { installZoomGuard } from './zoomGuard.ts'

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

installZoomGuard()
void useGames.getState().load()
void requestPersistentStorage()

// Don't lose the last debounced edit when the app is backgrounded or closed.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') void flushPendingSaves()
})
window.addEventListener('pagehide', () => void flushPendingSaves())

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
