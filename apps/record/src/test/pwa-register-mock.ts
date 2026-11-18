/** Test stand-in for `virtual:pwa-register/react` (provided by vite-plugin-pwa at build time). */
import { useState } from 'react'

export function useRegisterSW(_options?: unknown) {
  return {
    needRefresh: useState(false),
    offlineReady: useState(false),
    updateServiceWorker: async () => {},
  }
}
