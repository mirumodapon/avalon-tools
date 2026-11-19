import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QuestCards, questResultText } from './marks.tsx'

describe('quest result marks', () => {
  it('says success in green and fails in red', () => {
    expect(questResultText(0)).toBe('text-success-fg')
    expect(questResultText(2)).toBe('text-fail-fg')
  })

  it('tints each card like the choice buttons', () => {
    render(<QuestCards size={3} fails={1} />)
    const cards = screen.getAllByRole('listitem')
    expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual([
      '任務成功',
      '任務成功',
      '任務失敗',
    ])
    expect(cards[0]!.className).toContain('bg-quest-success/15')
    expect(cards[2]!.className).toContain('bg-quest-fail/25')
  })
})
