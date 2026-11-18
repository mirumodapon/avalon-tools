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

  it('shows roles and the evil-team marker when shown, without flagging failed-quest evil', () => {
    const { container } = render(<HistoryTable game={playedGame()} viewMode="full" showRoles />)
    expect(container.textContent).toContain('梅林')
    expect(container.textContent).toContain('隊伍含壞人')
    expect(container.textContent).not.toContain('失敗任務中的壞人')
  })
})

describe('PlayPage roles', () => {
  it('keeps roles hidden until explicitly revealed', () => {
    useGames.setState({ games: [playedGame()] })
    render(<PlayPage id="g" />)
    fireEvent.click(screen.getByRole('button', { name: '歷史表格' }))
    const tables = screen
      .getAllByRole('table')
      .map((t) => t.textContent)
      .join('')
    expect(tables).not.toMatch(ROLE_WORDS)
    fireEvent.click(screen.getByRole('button', { name: '遊戲設定' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).not.toMatch(/梅林|莫甘娜/)
    fireEvent.click(within(dialog).getByRole('button', { name: /顯示並編輯角色/ }))
    expect(dialog.textContent).toContain('梅林')
  })
})

describe('PlayPage game settings', () => {
  it('edits the title and note', () => {
    useGames.setState({ games: [playedGame()] })
    render(<PlayPage id="g" />)
    fireEvent.click(screen.getByRole('button', { name: '遊戲設定' }))
    const dialog = screen.getByRole('dialog')
    const title = within(dialog).getByRole('textbox', { name: '遊戲名稱' })
    fireEvent.change(title, { target: { value: '週五團' } })
    fireEvent.blur(title)
    const note = within(dialog).getByRole('textbox', { name: '備註' })
    fireEvent.change(note, { target: { value: '在咖啡廳' } })
    fireEvent.blur(note)
    const g = useGames.getState().games[0]!
    expect(g.name.custom).toBe('週五團')
    expect(g.note).toBe('在咖啡廳')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('週五團')
  })
})

describe('HistoryTable role legend', () => {
  it('lists the icons of roles in the game only when roles are shown', () => {
    const { unmount } = render(<HistoryTable game={playedGame()} viewMode="full" />)
    expect(screen.queryByRole('list', { name: '角色圖例' })).toBeNull()
    unmount()
    render(<HistoryTable game={playedGame()} viewMode="full" showRoles />)
    const legend = screen.getByRole('list', { name: '角色圖例' })
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((li) => li.textContent?.trim()),
    ).toEqual(['梅林', '派西維爾', '亞瑟的忠臣', '莫甘娜', '刺客', '隊伍含壞人'])
  })
})
