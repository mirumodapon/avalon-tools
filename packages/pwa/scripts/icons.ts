/**
 * Generates every app's icons from the tool registry: the tool's Tabler icon in its
 * Catppuccin accent on the base color, rendered to `apps/<id>/public/icon.svg`, then
 * expanded by @vite-pwa/assets-generator into favicon, apple-touch, PWA and maskable PNGs.
 *
 *   node packages/pwa/scripts/icons.ts [id...]
 */
import { tools } from '@avalon/registry'
import * as TablerIcons from '@tabler/icons-react'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { iconSvg } from '../src/icon.ts'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const config = fileURLToPath(new URL('../pwa-assets.config.ts', import.meta.url))
const require = createRequire(import.meta.url)
const cli = join(
  dirname(require.resolve('@vite-pwa/assets-generator/package.json')),
  'bin/pwa-assets-generator.mjs',
)

const only = process.argv.slice(2)
const targets = tools.filter(
  (t) =>
    existsSync(join(root, 'apps', t.id, 'package.json')) && (!only.length || only.includes(t.id)),
)

for (const tool of targets) {
  const Icon = (TablerIcons as unknown as Record<string, ComponentType<Record<string, unknown>>>)[
    tool.icon
  ]
  if (!Icon) throw new Error(`${tool.id}: unknown Tabler icon ${tool.icon}`)
  const glyph = renderToStaticMarkup(createElement(Icon, { size: 24, stroke: 1.75 }))
  const appDir = join(root, 'apps', tool.id)
  mkdirSync(join(appDir, 'public'), { recursive: true })
  writeFileSync(join(appDir, 'public/icon.svg'), iconSvg(glyph, tool.accent))
  execFileSync(process.execPath, [cli, '--root', appDir, '--config', config], { stdio: 'inherit' })
  console.warn(`icons: ${tool.id} (${tool.icon}, ${tool.accent})`)
}
