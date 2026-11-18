import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Changelog } from './Changelog.tsx'

describe('Changelog', () => {
  it('renders headings, bullets and code without Markdown symbols', () => {
    const { container } = render(
      <Changelog source={'# 更新紀錄\n\n## 2.0.0\n\n### 變更\n\n- 移到 `/record/`\n  - 細項\n'} />,
    )
    expect(screen.getByRole('heading', { name: '2.0.0' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '變更' })).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(container.querySelector('code')?.textContent).toBe('/record/')
    expect(container.textContent).not.toMatch(/#|`/)
    expect(screen.queryByText('更新紀錄')).toBeNull()
  })
})
