// oxlint-disable-next-line import/no-unassigned-import -- must run before any other code
import '@avalon/ui/polyfills'
import { requestPersistentStorage } from '@avalon/storage'
import { installZoomGuard, UpdateGate } from '@avalon/ui'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

installZoomGuard()
void requestPersistentStorage()

createRoot(root).render(
  <StrictMode>
    <UpdateGate>
      <App />
    </UpdateGate>
  </StrictMode>,
)
