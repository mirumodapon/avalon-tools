import { readFileSync } from 'node:fs'
import { flavors } from '@catppuccin/palette'
import { describe, expect, it } from 'vitest'
import { contrastRatio, ensureContrast, mix, parseHex, toHex } from './contrast.ts'
import { generateThemeCss, TEXT_CONTRAST } from './css.ts'
import { themeBootstrapScript } from './bootstrap.ts'
import { ACCENT_NAMES, FLAVOR_NAMES } from './palette.ts'
import { DEFAULT_THEME, normalizeTheme, resolveFlavor, themeColorOf } from './settings.ts'

describe('contrast', () => {
  it('round-trips hex', () => {
    expect(toHex(parseHex('#1e1e2e'))).toBe('#1e1e2e')
  })
  it('computes known ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1)
  })
  it('mixes colors', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
  })
  it('keeps a passing color untouched', () => {
    expect(ensureContrast('#000000', '#ffffff', '#000000')).toBe('#000000')
  })
})

describe('generateThemeCss', () => {
  const css = generateThemeCss()

  it('is in sync with the committed generated file', () => {
    const file = readFileSync(new URL('./flavors.generated.css', import.meta.url), 'utf8')
    expect(file).toBe(css)
  })

  it('emits every flavor/accent pair', () => {
    for (const f of FLAVOR_NAMES) {
      expect(css).toContain(`[data-flavor='${f}'] {`)
      expect(css).toContain(`--ctp-base: ${flavors[f].colors.base.hex};`)
      for (const a of ACCENT_NAMES)
        expect(css).toContain(`[data-flavor='${f}'][data-accent='${a}'],`)
    }
  })

  it('makes every -fg variant meet WCAG AA against base', () => {
    for (const f of FLAVOR_NAMES) {
      const block = css.split(`[data-flavor='${f}'] {`)[1]!.split('}')[0]!
      const base = flavors[f].colors.base.hex
      for (const m of block.matchAll(/--ctp-[a-z0-9]+-fg: (#[0-9a-f]{6});/g)) {
        expect(contrastRatio(m[1]!, base)).toBeGreaterThanOrEqual(TEXT_CONTRAST)
      }
    }
  })
})

describe('theme settings', () => {
  it('resolves system flavor to Latte (light) or Macchiato (dark)', () => {
    expect(resolveFlavor(DEFAULT_THEME, true)).toBe('macchiato')
    expect(resolveFlavor(DEFAULT_THEME, false)).toBe('latte')
    expect(resolveFlavor({ ...DEFAULT_THEME, flavor: 'mocha' }, false)).toBe('mocha')
  })
  it('drops the legacy darkFlavor field', () => {
    expect(normalizeTheme({ flavor: 'system', darkFlavor: 'frappe', accent: 'teal' })).toEqual({
      flavor: 'system',
      accent: 'teal',
    })
  })
  it('normalizes garbage to defaults', () => {
    expect(normalizeTheme(null)).toEqual(DEFAULT_THEME)
    expect(normalizeTheme({ flavor: 'nope', accent: 'teal' })).toEqual({
      ...DEFAULT_THEME,
      accent: 'teal',
    })
  })
  it('uses the flavor base color for theme-color', () => {
    expect(themeColorOf('mocha')).toBe(flavors.mocha.colors.base.hex)
  })
})

function run(stored: unknown, prefersDark: boolean) {
  const attrs: Record<string, string> = {}
  const meta = { content: '' }
  const storage = { getItem: () => (stored === undefined ? null : JSON.stringify(stored)) }
  const doc = {
    documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) },
    querySelector: () => meta,
  }
  const win = { matchMedia: () => ({ matches: prefersDark }) }
  new Function('localStorage', 'document', 'window', themeBootstrapScript({ storageKey: 'k' }))(
    storage,
    doc,
    win,
  )
  return { attrs, meta }
}

describe('bootstrap script', () => {
  it('applies defaults when nothing is stored', () => {
    const { attrs, meta } = run(undefined, true)
    expect(attrs).toEqual({ 'data-flavor': 'macchiato', 'data-accent': 'mauve' })
    expect(meta.content).toBe(flavors.macchiato.colors.base.hex)
  })
  it('applies the stored theme', () => {
    expect(run({ data: { theme: { flavor: 'frappe', accent: 'blue' } } }, false).attrs).toEqual({
      'data-flavor': 'frappe',
      'data-accent': 'blue',
    })
    const { attrs } = run(
      { version: 1, data: { theme: { flavor: 'system', darkFlavor: 'frappe', accent: 'teal' } } },
      true,
    )
    expect(attrs).toEqual({ 'data-flavor': 'macchiato', 'data-accent': 'teal' })
    expect(
      run({ data: { theme: { flavor: 'system', darkFlavor: 'frappe', accent: 'teal' } } }, false)
        .attrs['data-flavor'],
    ).toBe('latte')
  })
})
