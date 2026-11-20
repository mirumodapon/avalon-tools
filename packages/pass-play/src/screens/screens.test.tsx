import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RoleSetup, type RoleSelection } from '../RoleSetup.tsx'
import type { QuestAction } from '../quest.ts'
import type { VoteAction } from '../vote.ts'
import { DealSteps } from './DealSteps.tsx'
import { LadySteps } from './LadySteps.tsx'
import { QuestSteps } from './QuestSteps.tsx'
import { VoteSteps } from './VoteSteps.tsx'

describe('pass-the-phone screens', () => {
  it('QuestSteps hands the phone to whoever `who` names', () => {
    const who = vi.fn<(i: number) => string>((i: number) => `${i + 3} 號・小明`)
    render(
      <QuestSteps
        flow={{ step: 'handoff', size: 2, index: 1, fails: 0, played: ['success'] }}
        dispatch={() => {}}
        who={who}
      />,
    )
    expect(screen.getByText(/請將手機交給/)).toBeTruthy()
    expect(screen.getByText('4 號・小明')).toBeTruthy()
    expect(who).toHaveBeenCalledWith(1)
  })

  it('DealSteps names the seat from `who`', () => {
    render(
      <DealSteps
        flow={{
          step: 'handoff',
          mode: 'deal',
          recordId: 'r',
          table: [{ seat: 1, role: 'merlin' }],
          index: 0,
        }}
        dispatch={() => {}}
        who={() => '1 號・阿明'}
      />,
    )
    expect(screen.getByText('1 號・阿明')).toBeTruthy()
  })

  it('LadySteps names the holder when the phone goes to them', () => {
    render(
      <LadySteps
        flow={{ step: 'toHolder', shown: 'good' }}
        dispatch={() => {}}
        target="2 號"
        holder="5 號・小華"
      />,
    )
    expect(screen.getByText('5 號・小華')).toBeTruthy()
  })

  it('RoleSetup reports a new player count with its default roles', () => {
    const onChange = vi.fn<(next: RoleSelection) => void>()
    render(<RoleSetup playerCount={5} special={['merlin', 'assassin']} onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: '7' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ playerCount: 7 }))
  })

  it('VoteSteps offers 同意 and 反對 to the voter', () => {
    const dispatch = vi.fn<(a: VoteAction) => void>()
    render(
      <VoteSteps
        flow={{ step: 'choose', total: 5, index: 0, votes: [], order: ['reject', 'approve'] }}
        dispatch={dispatch}
        who={() => '1 號'}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '同意' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'vote', vote: 'approve' })
    expect(screen.getByRole('button', { name: '反對' })).toBeTruthy()
  })

  it('VoteSteps hands the phone on by name', () => {
    render(
      <VoteSteps
        flow={{ step: 'handoff', total: 5, index: 2, votes: [] }}
        dispatch={() => {}}
        who={(i) => `${i + 1} 號・小美`}
      />,
    )
    expect(screen.getByText('3 號・小美')).toBeTruthy()
  })

  it('QuestSteps gives a player who must succeed two 任務成功 buttons, still in both colours', () => {
    const dispatch = vi.fn<(a: QuestAction) => void>()
    render(
      <QuestSteps
        flow={{
          step: 'choose',
          size: 2,
          index: 0,
          fails: 0,
          played: [],
          order: ['fail', 'success'],
        }}
        dispatch={dispatch}
        who={() => '1 號'}
        successOnly={() => true}
      />,
    )
    const buttons = screen.getAllByRole('button', { name: '任務成功' })
    expect(buttons).toHaveLength(2)
    expect(screen.queryByRole('button', { name: '任務失敗' })).toBeNull()
    // Same look as usual: the first button keeps the fail card's colours.
    expect(buttons[0]!.className).toContain('border-quest-fail')
    expect(buttons[1]!.className).toContain('border-quest-success')
    fireEvent.click(buttons[0]!)
    expect(dispatch).toHaveBeenCalledWith({ type: 'play', card: 'success' })
  })
})
