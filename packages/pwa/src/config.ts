import { manifestName, nestedToolPaths, tools as allTools, type ToolMeta } from '@avalon/registry'
import { flavors } from '@catppuccin/palette'
import type { VitePWAOptions } from 'vite-plugin-pwa'

/** Splash / title-bar color: base of the app's dark flavor (unchanged from 1.x). */
export const PWA_THEME_COLOR = flavors.macchiato.colors.base.hex

/** Files produced by the icon script in each app's `public/`. */
export const PWA_ICONS = [
  { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
  { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
  { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
  { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
] as const

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Matches a tool path with or without its trailing slash, e.g. `/record` and `/record/…`. */
export function pathPattern(path: string): RegExp {
  return new RegExp(`^${escapeRegExp(path.replace(/\/$/, ''))}(/|$)`)
}

/** Workbox cache-name prefix; distinct per app so caches never collide. */
export function cacheIdOf(tool: ToolMeta): string {
  return `avalon-${tool.id}`
}

export interface PwaConfigOptions {
  /** Extra scripts imported into the generated service worker (paths relative to it). */
  importScripts?: string[]
}

/**
 * vite-plugin-pwa options for one tool. Each tool is its own installable app:
 * a unique manifest `id`, its own `scope`/`start_url`, and a service worker that
 * never answers navigations for other tools nested in its scope.
 */
export function createPwaConfig(
  tool: ToolMeta,
  { importScripts = [] }: PwaConfigOptions = {},
  tools: readonly ToolMeta[] = allTools,
): Partial<VitePWAOptions> {
  return {
    registerType: 'prompt',
    includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
    manifest: {
      id: tool.path,
      name: manifestName(tool),
      short_name: tool.shortName,
      description: tool.description,
      lang: 'zh-Hant-TW',
      start_url: tool.path,
      scope: tool.path,
      display: 'standalone',
      orientation: 'portrait',
      theme_color: PWA_THEME_COLOR,
      background_color: PWA_THEME_COLOR,
      icons: PWA_ICONS.map((i) => ({ ...i })),
    },
    workbox: {
      cacheId: cacheIdOf(tool),
      // App shell: precache this app's built files and serve its index.html offline.
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      navigateFallback: 'index.html',
      navigateFallbackDenylist: nestedToolPaths(tool, tools).map(pathPattern),
      cleanupOutdatedCaches: true,
      importScripts,
    },
  }
}
