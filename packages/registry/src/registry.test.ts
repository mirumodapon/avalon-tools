import { existsSync, readFileSync } from 'node:fs'
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

describe('registry', () => {
  it('is valid: unique ids and paths, well-formed paths', () => {
    expect(validateTools(tools)).toEqual([])
  })

  it('has an app (with a matching version) for every tool that is not coming-soon', () => {
    const problems = builtTools().flatMap((t) => {
      const pkg = join(root, 'apps', t.id, 'package.json')
      if (!existsSync(pkg)) return [`apps/${t.id} is missing`]
      const { version } = JSON.parse(readFileSync(pkg, 'utf8')) as { version: string }
      return version === t.version ? [] : [`${t.id}: registry ${t.version} ≠ package ${version}`]
    })
    expect(problems).toEqual([])
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
    version: '1.0.0',
  }
  it('reports duplicates and malformed entries', () => {
    const problems = validateTools([
      base,
      { ...base, id: 'a', path: '/a/' },
      { ...base, id: 'a', path: '/a/' },
      { ...base, id: 'Bad', path: '/bad' },
      { ...base, id: 'b', path: '/b/', icon: 'castle', version: '1' },
    ])
    expect(problems).toEqual(
      expect.arrayContaining([
        'duplicate id: a',
        'duplicate path: /a/',
        'Bad: id must be lowercase letters, digits and dashes',
        'Bad: path must be /Bad/ (got /bad)',
        'b: icon must be a Tabler component name',
        'b: version must be x.y.z',
      ]),
    )
  })
  it('requires home', () => {
    expect(validateTools([{ ...base, id: 'a', path: '/a/' }])).toContain('home is required')
  })
})
