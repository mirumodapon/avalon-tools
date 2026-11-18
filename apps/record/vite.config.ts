import { createPwaConfig } from '@avalon/pwa'
import { toolById } from '@avalon/registry'
import { catppuccinThemePlugin } from '@avalon/theme/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const RECORD = toolById('record')

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

/** Short commit hash of the build; falls back to the CI SHA or "dev" outside git. */
function gitRev(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev'
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(`${pkg.version}-${gitRev()}`),
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
    catppuccinThemePlugin({ storageKeys: ['avalon:global:theme'] }),
    react(),
    tailwindcss(),
    VitePWA(createPwaConfig(RECORD)),
  ],
})
