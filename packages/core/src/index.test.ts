import { describe, expect, it } from 'vitest'
import { CORE_VERSION } from './index.ts'

describe('core', () => {
  it('exposes a version', () => {
    expect(CORE_VERSION).toBeTypeOf('string')
  })
})
