import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DocsLink } from './DocsLink.tsx'

describe('DocsLink', () => {
  it('always opens the docs in a new tab', () => {
    // Even if a caller tries to force the same tab, the docs open separately.
    const props = { target: '_self', rel: 'opener' } as object
    render(
      <DocsLink href="/docs/guide/" {...props}>
        說明
      </DocsLink>,
    )
    const link = screen.getByRole('link', { name: '說明' })
    expect(link.getAttribute('href')).toBe('/docs/guide/')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener')
  })
})
