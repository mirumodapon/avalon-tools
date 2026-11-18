import { catppuccinThemePlugin } from '@avalon/theme/vite'
import { flavors } from '@catppuccin/palette'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

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

/** Splash / title-bar color: base of the app's dark flavor. */
const DARK_BASE = flavors.macchiato.colors.base.hex

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(`${pkg.version}-${gitRev()}`),
  },
  // Deployed under a sub-path on GitHub Pages project sites (set by the deploy workflow).
  base: process.env.BASE_PATH || '/',
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
    catppuccinThemePlugin({ storageKey: 'avalon-recorder:settings' }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: '阿瓦隆紀錄',
        short_name: '阿瓦隆',
        description: '阿瓦隆（The Resistance: Avalon）桌遊紀錄工具',
        lang: 'zh-Hant-TW',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: DARK_BASE,
        background_color: DARK_BASE,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell: precache every built asset and serve index.html for navigations offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
