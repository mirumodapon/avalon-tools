import { flavors } from '@catppuccin/palette'
import type { AccentName, ColorName, FlavorName } from '@catppuccin/palette'

export type { AccentName, ColorName, FlavorName }

/** Light and dark flavors used by the app. */
export const LIGHT_FLAVOR = 'latte' satisfies FlavorName
export const DARK_FLAVOR = 'macchiato' satisfies FlavorName
export const FLAVOR_NAMES = [LIGHT_FLAVOR, DARK_FLAVOR] as const
export type AppFlavor = (typeof FLAVOR_NAMES)[number]

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

export function hexOf(flavor: FlavorName, color: ColorName): string {
  return flavors[flavor].colors[color].hex
}

export function isDarkFlavor(flavor: FlavorName): boolean {
  return flavors[flavor].dark
}
