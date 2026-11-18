import { flavors } from '@catppuccin/palette'
import { describe, expect, it } from 'vitest'
import { ICON_BACKGROUND, iconSvg } from './icon.ts'

const tabler =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16"/></svg>'

describe('iconSvg', () => {
  it('puts the accent-colored glyph on the base color, centered at half size', () => {
    const svg = iconSvg(tabler, 'green')
    const green = flavors.macchiato.colors.green.hex
    expect(svg).toContain(`fill="${ICON_BACKGROUND}"`)
    expect(svg).toContain(`stroke="${green}"`)
    expect(svg).toContain('translate(128 128) scale(10.666666666666666)')
    expect(svg).toContain('<path d="M4 4h16"/>')
    expect(svg).not.toContain('currentColor')
  })
})
