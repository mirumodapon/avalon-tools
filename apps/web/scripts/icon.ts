/**
 * Generates public/icon.svg (Tabler crown on Catppuccin colors) — the source
 * for the PWA icon set produced by `pwa-assets-generator`.
 */
import { flavors } from '@catppuccin/palette'
import { IconCrown } from '@tabler/icons-react'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const { base } = flavors.macchiato.colors
const { mauve, yellow } = flavors.macchiato.colors

const crown = renderToStaticMarkup(
  createElement(IconCrown, { size: 300, stroke: 1.6, color: yellow.hex, x: 106, y: 96 }),
)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${base.hex}"/>
  <circle cx="256" cy="256" r="190" fill="none" stroke="${mauve.hex}" stroke-width="14" opacity="0.6"/>
  ${crown}
</svg>
`
const target = fileURLToPath(new URL('../public/icon.svg', import.meta.url))
writeFileSync(target, svg)
console.warn(`wrote ${target}`)
