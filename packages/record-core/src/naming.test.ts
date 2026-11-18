import { describe, expect, it } from 'vitest'
import {
  DEFAULT_NAMING,
  displayName,
  formatDate,
  nextSeq,
  renderName,
  sanitizeFilename,
} from './naming.ts'

const at = new Date(2026, 10, 18, 9, 5) // 2026-11-18 09:05 local
const ctx = { startedAt: at, seq: 3, players: 7, winner: null }

describe('renderName', () => {
  it('uses the default template', () => {
    expect(renderName(DEFAULT_NAMING, ctx)).toBe('2026-11-18 第3場')
  })

  it('supports every placeholder', () => {
    const t = { template: '{date}|{seq}|{time}|{players}|{winner}', dateFormat: 'YYYY-MM-DD' }
    expect(renderName(t, ctx)).toBe('2026-11-18|3|09:05|7|')
    expect(renderName(t, { ...ctx, winner: 'good' })).toBe('2026-11-18|3|09:05|7|好人')
    expect(renderName(t, { ...ctx, winner: 'evil' })).toMatch(/壞人$/)
  })

  it('uses the configured date format and inline formats', () => {
    expect(renderName({ template: '{date}', dateFormat: 'MM/DD' }, ctx)).toBe('11/18')
    expect(renderName({ template: '{date:M月D日} #{seq}', dateFormat: 'YYYY' }, ctx)).toBe(
      '11月18日 #3',
    )
    expect(formatDate(new Date(2026, 0, 5), 'YY/M/D')).toBe('26/1/5')
  })

  it('collapses whitespace left by empty placeholders and keeps unknown ones', () => {
    expect(renderName({ template: '{winner}  勝 {foo}', dateFormat: '' }, ctx)).toBe('勝 {foo}')
  })
})

const g = (createdAt: Date, seq: number) => ({
  createdAt: createdAt.toISOString(),
  name: { custom: null, auto: '', seq },
})

describe('nextSeq', () => {
  it('starts at 1 on a new day', () => {
    expect(nextSeq([g(new Date(2026, 10, 17, 20), 4)], at)).toBe(1)
  })

  it('increments within the same day', () => {
    expect(nextSeq([g(new Date(2026, 10, 18, 1), 1), g(new Date(2026, 10, 18, 8), 2)], at)).toBe(3)
  })

  it('never reuses a number below the max after deletions', () => {
    // game #1 was deleted; #2 remains
    expect(nextSeq([g(new Date(2026, 10, 18, 8), 2)], at)).toBe(3)
  })

  it('keeps imported seq values', () => {
    expect(nextSeq([g(new Date(2026, 10, 18, 8), 7)], at)).toBe(8)
  })
})

describe('displayName', () => {
  const game = {
    createdAt: at.toISOString(),
    players: Array.from({ length: 7 }, (_, i) => ({ id: `p${i}`, name: '' })),
    name: { custom: null as string | null, auto: '2026-11-18 第3場', seq: 3 },
  }

  it('prefers the custom name', () => {
    expect(
      displayName({ ...game, name: { ...game.name, custom: '週五團' } }, DEFAULT_NAMING, null),
    ).toBe('週五團')
  })

  it('applies the current template live to unnamed games', () => {
    expect(displayName(game, DEFAULT_NAMING, null)).toBe('2026-11-18 第3場')
    expect(displayName(game, { template: '{players}人 {winner}勝', dateFormat: '' }, 'evil')).toBe(
      '7人 壞人勝',
    )
  })

  it('falls back to the stored auto name if the template renders empty', () => {
    expect(displayName(game, { template: '{winner}', dateFormat: '' }, null)).toBe(
      '2026-11-18 第3場',
    )
  })
})

describe('sanitizeFilename', () => {
  it('removes illegal characters', () => {
    expect(sanitizeFilename('2026-11-18 第3場')).toBe('2026-11-18_第3場')
    expect(sanitizeFilename('a/b\\c:d*e?"f"<g>|h')).toBe('a_b_c_d_e_f_g_h')
    expect(sanitizeFilename('  ..  ')).toBe('avalon')
  })
})
