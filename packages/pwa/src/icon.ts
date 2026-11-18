import { flavors, type AccentName } from '@catppuccin/palette'

/** Icon background: the base of the app's dark flavor (same as the 1.x icon). */
export const ICON_BACKGROUND = flavors.macchiato.colors.base.hex

const SIZE = 512
/** Glyph size: half the canvas keeps it well inside the maskable safe zone (80% circle). */
const GLYPH = 256

/**
 * Builds an app icon from a rendered 24×24 Tabler SVG: accent-colored glyph on a soft
 * accent disc, over the base color. Full-bleed, so the same file works as maskable.
 */
export function iconSvg(tablerSvg: string, accent: AccentName): string {
  const color = flavors.macchiato.colors[accent].hex
  const inner = tablerSvg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '')
    .replace(/currentColor/g, color)
  const offset = (SIZE - GLYPH) / 2
  const scale = GLYPH / 24
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${ICON_BACKGROUND}"/>
  <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="176" fill="${color}" opacity="0.14"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner}</g>
</svg>
`
}
