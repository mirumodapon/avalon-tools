import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { chooseLicense, detectLicense, packageOf, readPackage, renderNotices } from './licenses.ts'

describe('packageOf', () => {
  it('finds the package behind a bundled module, scoped or not', () => {
    expect(packageOf('/w/node_modules/.pnpm/dexie@4/node_modules/dexie/dist/dexie.mjs')).toEqual({
      name: 'dexie',
      dir: '/w/node_modules/.pnpm/dexie@4/node_modules/dexie',
    })
    expect(packageOf('/w/node_modules/@tabler/icons-react/dist/esm/icons/IconX.mjs?v=1')).toEqual({
      name: '@tabler/icons-react',
      dir: '/w/node_modules/@tabler/icons-react',
    })
  })

  it('ignores our own sources and virtual modules', () => {
    expect(packageOf('/w/packages/ui/src/AppShell.tsx')).toBeNull()
    expect(packageOf('\0vite/preload-helper.js')).toBeNull()
  })
})

describe('chooseLicense', () => {
  it('accepts permissive licenses', () => {
    expect(chooseLicense('MIT')).toBe('MIT')
    expect(chooseLicense('Apache-2.0')).toBe('Apache-2.0')
  })

  it('uses the permissive option of a dual license', () => {
    expect(chooseLicense('(MPL-2.0 OR Apache-2.0)')).toBe('Apache-2.0')
    expect(chooseLicense('(MIT OR CC0-1.0)')).toBe('MIT')
  })

  it('refuses copyleft licenses', () => {
    expect(chooseLicense('EPL-2.0 OR GPL-3.0-or-later')).toBeNull()
    expect(chooseLicense('LGPL-3.0-or-later')).toBeNull()
    expect(chooseLicense('MPL-2.0')).toBeNull()
    expect(chooseLicense('MIT AND GPL-3.0')).toBeNull()
    expect(chooseLicense('UNKNOWN')).toBeNull()
  })
})

describe('detectLicense', () => {
  it('reads the license from the text when package.json names none', () => {
    expect(
      detectLicense('The MIT License (MIT)\n\nPermission is hereby granted, free of charge'),
    ).toBe('MIT')
    expect(detectLicense('Apache License\nVersion 2.0, January 2004')).toBe('Apache-2.0')
    expect(detectLicense('GNU GENERAL PUBLIC LICENSE')).toBeNull()
  })
})

describe('notices', () => {
  it('collects license and NOTICE files and lists every package', () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'lic-')), 'node_modules', 'demo')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'demo', version: '1.0.0', license: '(MPL-2.0 OR Apache-2.0)' }),
    )
    writeFileSync(join(dir, 'NOTICE'), 'Demo NOTICE')
    writeFileSync(join(dir, 'LICENSE'), 'Demo license text')
    const notice = readPackage(dir)
    expect(notice.license).toBe('Apache-2.0')
    expect(notice.files.map((f) => f.name)).toEqual(['LICENSE', 'NOTICE'])
    const text = renderNotices('測試', [notice])
    expect(text).toContain('- demo@1.0.0：(MPL-2.0 OR Apache-2.0)（以 Apache-2.0 使用）')
    expect(text).toContain('Demo license text')
    expect(text).toContain('Demo NOTICE')
    expect(text).toContain('本專案以 MIT 授權釋出')
  })

  it('falls back to the license file when package.json has no license', () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'lic-')), 'node_modules', 'bare')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'bare', version: '2.1.0' }))
    writeFileSync(join(dir, 'license'), 'The MIT License (MIT)\n\nPermission is hereby granted…')
    expect(readPackage(dir)).toMatchObject({ declared: 'MIT', license: 'MIT' })
  })
})
