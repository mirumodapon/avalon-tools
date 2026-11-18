import {
  createGame,
  defaultPlayerNames,
  defaultRoleConfig,
  gameReducer,
  makePlayers,
  uniformVotes,
  type Game,
  type RoleAssignment,
} from '@avalon/core'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { HistoryTable } from '../components/HistoryTable.tsx'
import { useGames } from '../games/store.ts'
import { PlayPage } from '../pages/PlayPage.tsx'
import { RoleAssignmentEditor } from './RoleAssignmentEditor.tsx'

const players = makePlayers(defaultPlayerNames(5))

function Harness({ initial }: { initial: RoleAssignment }) {
  const [a, setA] = useState(initial)
  return (
    <RoleAssignmentEditor
      players={players}
      assignment={a}
      config={defaultRoleConfig(5)}
      onChange={setA}
    />
  )
}

describe('RoleAssignmentEditor', () => {
  it('disables roles that are used up and allows partial assignment', () => {
    render(<Harness initial={{ p1: 'merlin' }} />)
    fireEvent.click(screen.getByRole('button', { name: /2號/ }))
    const group = screen.getByRole('group', { name: '2號的角色' })
    const merlin = within(group).getByRole('button', { name: /梅林/ })
    expect((merlin as HTMLButtonElement).disabled).toBe(true)
    expect(merlin.textContent).toContain('已用完')
    fireEvent.click(within(group).getByRole('button', { name: /莫甘娜/ }))
    expect(screen.getByRole('button', { name: /2號/ }).textContent).toContain('莫甘娜')
    expect(screen.getAllByText('未指定')).toHaveLength(3)
  })
})

function playedGame(): Game {
  let g = createGame({
    id: 'g',
    now: 'n',
    players,
    roleConfig: defaultRoleConfig(5),
    roleAssignment: { p1: 'merlin', p2: 'morgana', p3: 'loyal' },
  })
  const ids = players.map((p) => p.id)
  g = gameReducer(g, {
    type: 'propose',
    team: ['p1', 'p2'],
    votes: uniformVotes(ids, 'approve'),
    inputMode: 'approvals',
  })
  return gameReducer(g, { type: 'recordQuest', failCount: 1 })
}

const ROLE_WORDS = /梅林|莫甘娜|忠臣|好人|壞人/

describe('HistoryTable roles', () => {
  it('shows no role or faction information when hidden', () => {
    const { container } = render(<HistoryTable game={playedGame()} viewMode="anomaly" />)
    expect(container.textContent).not.toMatch(ROLE_WORDS)
    expect(container.innerHTML).not.toMatch(/evil|good/)
  })

  it('shows roles, the evil-team marker and exposed evil members when shown', () => {
    const { container } = render(<HistoryTable game={playedGame()} viewMode="full" showRoles />)
    expect(container.textContent).toContain('梅林')
    expect(container.textContent).toContain('隊伍含壞人')
    expect(container.textContent).toContain('2號，隊員，失敗任務中的壞人')
  })
})

describe('PlayPage roles', () => {
  it('keeps roles hidden until explicitly revealed', () => {
    useGames.setState({ games: [playedGame()] })
    render(<PlayPage id="g" />)
    fireEvent.click(screen.getByRole('radio', { name: '歷史表格' }))
    expect(screen.getByRole('table').textContent).not.toMatch(ROLE_WORDS)
    fireEvent.click(screen.getByRole('button', { name: '角色' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).not.toMatch(/梅林|莫甘娜/)
    fireEvent.click(within(dialog).getByRole('button', { name: /顯示並編輯角色/ }))
    expect(dialog.textContent).toContain('梅林')
  })
})
