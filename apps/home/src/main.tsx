import { requestPersistentStorage } from '@avalon/storage'
import { installZoomGuard, markHomeWindow, UpdateGate } from '@avalon/ui'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './index.css'
import { clearLegacyCaches } from './legacy/caches.ts'
import { legacyRedirect } from './legacy/redirect.ts'

function start() {
  const root = document.getElementById('root')
  if (!root) throw new Error('#root not found')

  installZoomGuard()
  // Tools opened from the installed home keep their link back to it.
  markHomeWindow()
  void requestPersistentStorage()
  void clearLegacyCaches()

  createRoot(root).render(
    <StrictMode>
      <UpdateGate>
        <App />
      </UpdateGate>
    </StrictMode>,
  )
}

// Old 1.x links (`/#/play/…`, `/?s=…`) belong to the record tool now.
const legacy = legacyRedirect(window.location)
if (legacy) window.location.replace(legacy)
else start()
