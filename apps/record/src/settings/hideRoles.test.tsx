import { createGame, defaultPlayerNames, makePlayers } from '@avalon/record-core'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '../App.tsx'
import { useGames } from '../games/store.ts'
import { useSettings } from './store.ts'

const game = {
  ...createGame({
    id: 'g',
    now: '2026-11-18T10:00:00Z',
    players: makePlayers(defaultPlayerNames(5)),
    roleAssignment: { p1: 'merlin' },
  }),
  savedAt: '2026-11-18T11:00:00Z',
}

function go(hash: string) {
  act(() => {
    window.location.hash = hash
  })
}

const rolesVisible = () =>
  screen.queryByRole('list', { name: '角色圖例' }) !== null || screen.queryByText('梅林') !== null

afterEach(() => {
  go('')
  useGames.setState({ games: [] })
  useSettings.getState().reset()
})

describe('瀏覽時預設隱藏角色', () => {
  it('hides roles by default; toggling in a game does not change the setting', () => {
    useGames.setState({ games: [game] })
    go('#/game/g')
    const view = render(<App />)
    expect(rolesVisible()).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: /顯示設定/ }))
    fireEvent.click(
      within(screen.getByRole('dialog', { name: '顯示設定' })).getByRole('switch', {
        name: /顯示角色/,
      }),
    )
    expect(rolesVisible()).toBe(true)
    expect(useSettings.getState().settings.showRoles).toBe(false)

    view.unmount()
    render(<App />) // open the game again
    expect(rolesVisible()).toBe(false)
  })

  it('shows roles when the setting is turned off', () => {
    useGames.setState({ games: [game] })
    go('#/settings')
    const settings = render(<App />)
    fireEvent.click(screen.getByRole('switch', { name: /瀏覽時預設隱藏角色/ }))
    settings.unmount()
    go('#/game/g')
    render(<App />)
    expect(rolesVisible()).toBe(true)
  })
})
