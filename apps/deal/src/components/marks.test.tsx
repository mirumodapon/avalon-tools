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
    expect(cards[0]!.firstElementChild!.className).toContain('bg-quest-success/15')
    expect(cards[2]!.firstElementChild!.className).toContain('bg-quest-fail/25')
  })

  it('follows and numbers the play order when given', () => {
    render(<QuestCards size={3} fails={1} cards={['fail', 'success', 'success']} />)
    expect(screen.getAllByRole('listitem').map((c) => c.getAttribute('aria-label'))).toEqual([
      '第 1 位：任務失敗',
      '第 2 位：任務成功',
      '第 3 位：任務成功',
    ])
  })
})
