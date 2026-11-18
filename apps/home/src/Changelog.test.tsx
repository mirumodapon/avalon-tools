import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Changelog, latestVersions } from './Changelog.tsx'

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

  it('shows only the three most recent versions', () => {
    const source = [
      '# 更新紀錄',
      '## 4.0.0',
      '- d',
      '## 3.0.0',
      '- c',
      '## 2.0.0',
      '- b',
      '## 1.0.0',
      '- a',
    ].join('\n')
    render(<Changelog source={source} />)
    expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual([
      '4.0.0',
      '3.0.0',
      '2.0.0',
    ])
    expect(screen.queryByText('a')).toBeNull()
    expect(latestVersions(source, 1)).toBe('# 更新紀錄\n## 4.0.0\n- d')
    expect(latestVersions(source, 9)).toBe(source)
  })
})
