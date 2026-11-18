import { createGame, defaultPlayerNames, gamesToJson, makePlayers } from '@avalon/core'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryGameRepository } from '../db/memory.ts'
import { setRepository, useGames } from '../games/store.ts'
import { useSettings } from '../settings/store.ts'
import { ExportSheet } from './ExportSheet.tsx'
import { ImportSheet } from './ImportSheet.tsx'

/** Controllable stand-in for html-to-image so the busy state can be observed. */
const png = vi.hoisted(() => {
  const pending: { resolve?: (b: Blob) => void } = {}
  return {
    resolve: (b: Blob) => pending.resolve?.(b),
    toBlob: () =>
      new Promise<Blob>((r) => {
        pending.resolve = r
      }),
  }
})
vi.mock('html-to-image', () => ({ toBlob: png.toBlob }))

const game = (id: string, note = '') =>
  createGame({
    id,
    now: '2026-11-18T10:00:00.000Z',
    players: makePlayers(defaultPlayerNames(5)),
    name: { custom: null, auto: '', seq: 3 },
    note,
    roleAssignment: { p1: 'merlin' },
  })

let repo: MemoryGameRepository
beforeEach(() => {
  repo = new MemoryGameRepository()
  setRepository(repo)
})
afterEach(() => {
  setRepository(null)
  useGames.setState({ games: [] })
  useSettings.getState().reset()
})

describe('ExportSheet', () => {
  it('previews formats using the naming template for the file name', () => {
    render(<ExportSheet game={game('a', '備註內容')} open onClose={() => {}} />)
    expect(screen.getByText(/檔名：.*第3場\.json/)).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: 'Markdown' }))
    const preview = screen.getByRole<HTMLTextAreaElement>('textbox', { name: '預覽' })
    expect(preview.value).toMatch(/^# .*第3場\n\n> 備註內容/)
    expect(preview.value).not.toContain('梅林')
    fireEvent.click(screen.getByRole('switch', { name: '包含角色' }))
    expect(screen.getByRole<HTMLTextAreaElement>('textbox', { name: '預覽' }).value).toContain(
      '梅林',
    )
  })
})

describe('ImportSheet', () => {
  it('imports new games and lets the user choose for conflicts', async () => {
    const existing = game('a', 'local')
    useGames.setState({ games: [existing] })
    await repo.put(existing)
    render(<ImportSheet open onClose={() => {}} />)
    fireEvent.click(screen.getByText('或貼上 JSON 內容'))
    fireEvent.change(screen.getByRole('textbox', { name: '貼上 JSON' }), {
      target: { value: gamesToJson([game('a', 'imported'), game('b')]) },
    })
    fireEvent.click(screen.getByRole('button', { name: '讀取' }))
    expect(screen.getByText(/其中 1 場與現有遊戲 ID 相同/)).toBeTruthy()
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('radio', { name: '覆蓋' }))
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: /匯入 2 場/ }))
    })
    expect(screen.getByText('已匯入：新增 1、覆蓋 1、另存 0')).toBeTruthy()
    expect(repo.data.get('a')!.note).toBe('imported')
    expect(
      useGames
        .getState()
        .games.map((g) => g.id)
        .toSorted(),
    ).toEqual(['a', 'b'])
  })

  it('shows validation errors clearly', () => {
    render(<ImportSheet open onClose={() => {}} />)
    fireEvent.click(screen.getByText('或貼上 JSON 內容'))
    fireEvent.change(screen.getByRole('textbox', { name: '貼上 JSON' }), {
      target: { value: '{"schemaVersion":1}' },
    })
    fireEvent.click(screen.getByRole('button', { name: '讀取' }))
    expect(screen.getByRole('alert').textContent).toContain('無法匯入')
  })
})

describe('ExportSheet busy state', () => {
  it('shows a loading download button while the PNG is generated', async () => {
    URL.createObjectURL = () => 'blob:x'
    URL.revokeObjectURL = () => {}
    render(<ExportSheet game={game('a')} open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('radio', { name: 'PNG' }))
    fireEvent.click(screen.getByRole('button', { name: /下載/ }))
    const busy = await screen.findByRole('button', { name: /產生中/ })
    expect(busy).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: '複製到剪貼簿' })).toHaveProperty('disabled', true)
    await act(async () => png.resolve(new Blob(['x'], { type: 'image/png' })))
    expect(await screen.findByRole('button', { name: /^下載$/ })).toHaveProperty('disabled', false)
  })
})
