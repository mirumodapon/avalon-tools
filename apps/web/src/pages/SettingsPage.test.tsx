import { createGame, defaultPlayerNames, makePlayers } from '@avalon/core'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryGameRepository } from '../db/memory.ts'
import { setRepository, useGames } from '../games/store.ts'
import { useSettings } from '../settings/store.ts'
import { SettingsPage } from './SettingsPage.tsx'

let repo: MemoryGameRepository
beforeEach(() => {
  repo = new MemoryGameRepository()
  setRepository(repo)
})
afterEach(() => {
  setRepository(null)
  useSettings.getState().reset()
  useGames.setState({ games: [] })
})

describe('SettingsPage', () => {
  it('updates recording and display defaults', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByRole('radio', { name: /派跳（記異常）/ }))
    fireEvent.click(screen.getByRole('radio', { name: '派跳檢視' }))
    const hideRoles = screen.getByRole('switch', { name: /瀏覽時預設隱藏角色/ })
    expect(hideRoles).toHaveProperty('checked', true)
    fireEvent.click(hideRoles)
    fireEvent.click(screen.getByRole('switch', { name: /強制局自動設為全員贊成/ }))
    expect(useSettings.getState().settings).toMatchObject({
      defaultInputMode: 'anomalies',
      viewMode: 'anomaly',
      showRoles: true,
      forcedAutoApprove: false,
    })
  })

  it('requires two confirmations to clear all data', async () => {
    const g = createGame({
      id: 'g',
      now: '2026-11-18T10:00:00Z',
      players: makePlayers(defaultPlayerNames(5)),
    })
    await repo.put(g)
    useGames.setState({ games: [g] })
    useSettings.getState().update({ roster: ['阿明'] })
    render(<SettingsPage />)
    fireEvent.click(screen.getByRole('button', { name: /清除所有資料/ }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '繼續' }))
    expect(useGames.getState().games).toHaveLength(1)
    await act(async () => {
      await new Promise((r) => setTimeout(r))
    })
    await act(async () => {
      fireEvent.click(
        within(screen.getByRole('dialog', { name: '最後確認' })).getByRole('button', {
          name: '永久刪除',
        }),
      )
    })
    expect(useGames.getState().games).toHaveLength(0)
    expect(repo.data.size).toBe(0)
    expect(useSettings.getState().settings.roster).toEqual([])
  })
})
