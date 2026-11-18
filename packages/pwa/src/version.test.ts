import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildVersion, repoVersion } from './version.ts'

describe('version', () => {
  it('is the root package.json version for every app', () => {
    const root = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'))
    expect(repoVersion()).toBe(root.version)
    expect(buildVersion()).toMatch(new RegExp(`^${repoVersion().replaceAll('.', '\\.')}-\\w+$`))
  })
})
