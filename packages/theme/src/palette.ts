import { flavors } from '@catppuccin/palette'
import type { AccentName, ColorName, FlavorName } from '@catppuccin/palette'

export type { AccentName, ColorName, FlavorName }

export const FLAVOR_NAMES = [
  'latte',
  'frappe',
  'macchiato',
  'mocha',
] as const satisfies readonly FlavorName[]

export const ACCENT_NAMES = [
  'rosewater',
  'flamingo',
  'pink',
  'mauve',
  'red',
  'maroon',
  'peach',
  'yellow',
  'green',
  'teal',
  'sky',
  'sapphire',
  'blue',
  'lavender',
] as const satisfies readonly AccentName[]

export const MONOCHROMATIC_NAMES = [
  'text',
  'subtext1',
  'subtext0',
  'overlay2',
  'overlay1',
  'overlay0',
  'surface2',
  'surface1',
  'surface0',
  'base',
  'mantle',
  'crust',
] as const

export const COLOR_NAMES: readonly ColorName[] = [...ACCENT_NAMES, ...MONOCHROMATIC_NAMES]

export const FLAVOR_LABELS: Record<FlavorName, string> = {
  latte: 'Latte',
  frappe: 'Frappé',
  macchiato: 'Macchiato',
  mocha: 'Mocha',
}

export function hexOf(flavor: FlavorName, color: ColorName): string {
  return flavors[flavor].colors[color].hex
}

export function isDarkFlavor(flavor: FlavorName): boolean {
  return flavors[flavor].dark
}
