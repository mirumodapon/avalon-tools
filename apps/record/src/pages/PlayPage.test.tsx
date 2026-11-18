import { createGame, defaultPlayerNames, deriveState, makePlayers } from '@avalon/core'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGames } from '../games/store.ts'
import { useSettings } from '../settings/store.ts'
import { PlayPage } from './PlayPage.tsx'

function setup(n = 5) {
  const game = createGame({
    id: 'g',
    now: '2026-11-18T10:00:00Z',
    players: makePlayers(defaultPlayerNames(n)),
  })
  useGames.setState({ games: [game] })
  render(<PlayPage id="g" />)
  return () => useGames.getState().games[0]!
}

function pickTeam(...names: string[]) {
  const region = screen.getByRole('region', { name: '選擇隊員' })
  for (const n of names)
    fireEvent.click(within(region).getByRole('button', { name: new RegExp(`^\\d+\\s*${n}`) }))
  fireEvent.click(screen.getByRole('button', { name: /下一步/ }))
}

function seat(name: string) {
  return within(screen.getByRole('region', { name: '記錄投票' })).getByRole('button', {
    name: new RegExp(`^${name}，`),
  })
}

describe('PlayPage', () => {
  beforeEach(() => {
    useSettings.setState({
      settings: {
        ...useSettings.getState().settings,
        defaultInputMode: 'approvals',
        forcedAutoApprove: true,
      },
    })
  })

  it('records a proposal in 派票 mode and a quest result', () => {
    const current = setup()
    pickTeam('1號', '2號')
    for (const n of ['1號', '2號', '3號']) fireEvent.click(seat(n))
    expect(screen.getByText('→ 通過')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /送出派票/ }))
    const p = current().rounds[0]!.proposals[0]!
    expect(p.votes).toEqual({
      p1: 'approve',
      p2: 'approve',
      p3: 'approve',
      p4: 'reject',
      p5: 'reject',
    })
    expect(p.inputMode).toBe('approvals')

    fireEvent.click(screen.getByRole('radio', { name: '1' }))
    expect(screen.getByText('任務失敗')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /送出任務結果/ }))
    expect(deriveState(current()).outcomes[0]).toBe('fail')
  })

  it('records 派跳 and keeps votes when switching modes', () => {
    const current = setup()
    pickTeam('1號', '2號')
    fireEvent.click(screen.getByRole('radio', { name: /派跳/ }))
    fireEvent.click(seat('2號')) // 場內黑
    fireEvent.click(seat('4號')) // 場外白
    expect(screen.getByText('場內黑')).toBeTruthy()
    expect(screen.getByText('場外白')).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: /派票/ }))
    fireEvent.click(screen.getByRole('radio', { name: /派跳/ }))
    fireEvent.click(screen.getByRole('button', { name: /送出派票/ }))
    const p = current().rounds[0]!.proposals[0]!
    expect(p.votes).toEqual({
      p1: 'approve',
      p2: 'reject',
      p3: 'reject',
      p4: 'approve',
      p5: 'reject',
    })
    expect(p.inputMode).toBe('anomalies')
    expect(deriveState(current())).toMatchObject({ phase: 'proposal', attempt: 2 })
  })

  it('auto-approves the forced proposal when enabled', () => {
    const current = setup()
    for (let i = 0; i < 4; i++) {
      pickTeam('1號', '2號')
      fireEvent.click(screen.getByRole('button', { name: /送出派票/ }))
    }
    expect(screen.getAllByText('強制局').length).toBeGreaterThan(0)
    pickTeam('1號', '2號')
    expect(screen.getByText(/已自動記為全員贊成/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /送出派票/ }))
    const p = current().rounds[0]!.proposals[4]!
    expect(p.forced).toBe(true)
    expect(Object.values(p.votes).every((v) => v === 'approve')).toBe(true)
    expect(deriveState(current()).phase).toBe('quest')
  })

  it('undoes the last step', () => {
    const current = setup()
    pickTeam('1號', '2號')
    fireEvent.click(screen.getByRole('button', { name: /送出派票/ }))
    fireEvent.click(screen.getByRole('button', { name: '復原上一步' }))
    const dialog = screen.getByRole('dialog', { name: '恢復上一步？' })
    expect(dialog.textContent).toContain('將刪除「任務 1 第 1 次派票」的紀錄。')
    // cancelling keeps the record
    fireEvent.click(within(dialog).getByRole('button', { name: '取消' }))
    expect(current().rounds).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '復原上一步' }))
    fireEvent.click(
      within(screen.getByRole('dialog', { name: '恢復上一步？' })).getByRole('button', {
        name: '恢復',
      }),
    )
    expect(current().rounds).toHaveLength(0)
  })

  it('starts the next proposal in the mode last used and remembers it', () => {
    setup()
    pickTeam('1號', '2號')
    fireEvent.click(screen.getByRole('radio', { name: /派跳/ }))
    fireEvent.click(screen.getByRole('button', { name: /送出派票/ }))
    expect(useSettings.getState().settings.defaultInputMode).toBe('anomalies')
    pickTeam('1號', '2號')
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /派跳/ }).checked).toBe(true)
  })

  it('gives evil the win when the 5th proposal is voted down', () => {
    useSettings.setState({
      settings: { ...useSettings.getState().settings, forcedAutoApprove: false },
    })
    const current = setup()
    for (let i = 0; i < 4; i++) {
      pickTeam('1號', '2號')
      fireEvent.click(screen.getByRole('button', { name: /送出派票/ }))
    }
    pickTeam('1號', '2號')
    expect(screen.getByText('→ 否決，壞人勝利')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /送出派票/ }))
    expect(deriveState(current())).toMatchObject({ winner: 'evil', winReason: 'forced-rejected' })
    expect(screen.getByText('壞人勝利')).toBeTruthy()
    expect(screen.getByText(/強制局未通過/)).toBeTruthy()
  })
})
