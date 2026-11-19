import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  builtTools,
  listedTools,
  manifestName,
  nestedToolPaths,
  tools,
  validateTools,
} from './registry.ts'
import type { ToolMeta } from './types.ts'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const tablerIcons = join(
  dirname(createRequire(import.meta.url).resolve('@tabler/icons-react/package.json')),
  'dist/esm/icons',
)

/** A minimal tool entry for ordering tests. */
const tool = (id: string, status: ToolMeta['status']): ToolMeta => ({
  id,
  name: id,
  shortName: id,
  description: '',
  path: `/${id}/`,
  icon: 'IconX',
  accent: 'blue',
  status,
})

describe('registry', () => {
  it('is valid: unique ids and paths, well-formed paths', () => {
    expect(validateTools(tools)).toEqual([])
  })

  it('has an app for every tool that is not coming-soon', () => {
    const missing = builtTools()
      .filter((t) => !existsSync(join(root, 'apps', t.id, 'package.json')))
      .map((t) => t.id)
    expect(missing).toEqual([])
  })

  it('only uses Tabler icons that exist', () => {
    const missing = tools
      .filter((t) => !existsSync(join(tablerIcons, `${t.icon}.mjs`)))
      .map((t) => t.icon)
    expect(missing).toEqual([])
  })

  it('lists tools for home without home itself', () => {
    expect(listedTools().map((t) => t.id)).not.toContain('home')
  })

  it('lists coming-soon tools after the usable ones, keeping registry order', () => {
    const list = [
      tool('home', 'stable'),
      tool('a', 'coming-soon'),
      tool('b', 'stable'),
      tool('c', 'coming-soon'),
      tool('d', 'beta'),
    ]
    expect(listedTools(list).map((x) => x.id)).toEqual(['b', 'd', 'a', 'c'])
    const statuses = listedTools().map((x) => x.status === 'coming-soon')
    expect(statuses).toEqual(statuses.toSorted())
  })

  it('names manifests', () => {
    const record = tools.find((t) => t.id === 'record')!
    expect(manifestName(record)).toBe('阿瓦隆・遊戲紀錄')
    expect(manifestName(tools.find((t) => t.id === 'home')!)).toBe('阿瓦隆工具集')
  })

  it('finds tool paths nested in a scope', () => {
    const home = tools.find((t) => t.id === 'home')!
    expect(nestedToolPaths(home)).toEqual(expect.arrayContaining(['/record/']))
    expect(nestedToolPaths(tools.find((t) => t.id === 'record')!)).toEqual([])
  })
})

describe('validateTools', () => {
  const base: ToolMeta = {
    id: 'home',
    name: 'x',
    shortName: 'x',
    description: '',
    path: '/',
    icon: 'IconX',
    accent: 'mauve',
    status: 'stable',
  }
  it('reports duplicates and malformed entries', () => {
    const problems = validateTools([
      base,
      { ...base, id: 'a', path: '/a/' },
      { ...base, id: 'a', path: '/a/' },
      { ...base, id: 'Bad', path: '/bad' },
      { ...base, id: 'b', path: '/b/', icon: 'castle' },
    ])
    expect(problems).toEqual(
      expect.arrayContaining([
        'duplicate id: a',
        'duplicate path: /a/',
        'Bad: id must be lowercase letters, digits and dashes',
        'Bad: path must be /Bad/ (got /bad)',
        'b: icon must be a Tabler component name',
      ]),
    )
  })
  it('requires home', () => {
    expect(validateTools([{ ...base, id: 'a', path: '/a/' }])).toContain('home is required')
  })
})
