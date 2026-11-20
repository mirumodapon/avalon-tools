import { readFileSync } from 'node:fs'
import { parseGamesJson } from '@avalon/record-core'
import { describe, expect, it } from 'vitest'
import { exportFields, FIELD_DOC } from './exportFormat.ts'

const example = readFileSync(new URL('../../dev/export-example.json', import.meta.url), 'utf8')

describe('export format docs', () => {
  it('shows an example that the game record imports as is', () => {
    const { games, errors } = parseGamesJson(example)
    expect(errors).toEqual([])
    expect(games).toHaveLength(1)
    // Nothing is dropped or added by the schema: the example is a complete export.
    expect(games).toEqual(JSON.parse(example))
  })

  it('documents every field of the schema, and only those', () => {
    const paths = exportFields().map((f) => f.path)
    expect(paths.filter((p) => !FIELD_DOC[p])).toEqual([])
    expect(Object.keys(FIELD_DOC).filter((p) => !paths.includes(p))).toEqual([])
  })

  it('reads limits and nullability from the schema', () => {
    const by = Object.fromEntries(exportFields().map((f) => [f.path, f]))
    expect(by['rounds[].proposals']!.limits).toBe('1–5 筆')
    expect(by.savedAt!.nullable).toBe(true)
    expect(by['rounds[].proposals[].inputMode']!.type).toBe('"approvals" | "anomalies"')
    expect(by.schemaVersion!.type).toBe('1')
  })
})
