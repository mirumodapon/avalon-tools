import { avalonPwa, buildVersion } from '@avalon/pwa'
import { toolById } from '@avalon/registry'
import { catppuccinThemePlugin } from '@avalon/theme/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const RECORD = toolById('record')

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion()),
  },
  // Deployed under a sub-path on GitHub Pages project sites (set by the deploy workflow).
  // Served at /record/ (from the tool registry).
  base: RECORD.path,
  // Pre-bundle every runtime dependency up front. Otherwise Vite discovers some of them
  // (e.g. react-dom used by portals, the lazily imported html-to-image) mid-session,
  // re-optimizes, and the open page fails to load stale chunks.
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'zustand',
      'dexie',
      '@avalon/record-core > zod',
      '@tabler/icons-react',
      '@catppuccin/palette',
      'html-to-image',
      'qrcode',
      'jsqr',
      'workbox-window',
    ],
  },
  plugins: [
    // 1.x kept the theme inside its settings; read it until the upgrade has run.
    catppuccinThemePlugin({ storageKeys: ['avalon:global:theme', 'avalon-recorder:settings'] }),
    react(),
    tailwindcss(),
    avalonPwa(RECORD),
  ],
})
