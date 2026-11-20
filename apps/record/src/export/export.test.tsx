import { createGame, defaultPlayerNames, gamesToJson, makePlayers } from '@avalon/record-core'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryGameRepository } from '../db/memory.ts'
import { setRepository, useGames } from '../games/store.ts'
import { useSettings } from '../settings/store.ts'
import { ExportSheet } from './ExportSheet.tsx'
import { ImportSheet } from './ImportSheet.tsx'

/** Controllable stand-in for html-to-image so the busy state can be observed. */
const png = vi.hoisted(() => {
  const pending: { resolve?: (b: Blob) => void; started: number } = { started: 0 }
  return {
    pending,
    resolve: (b: Blob) => pending.resolve?.(b),
    toBlob: () =>
      new Promise<Blob>((r) => {
        pending.started++
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

/** Everything that changes how the exported image looks. */
function styleControls(): HTMLInputElement[] {
  return [
    ...screen.getAllByRole('radio'),
    screen.getByRole('switch', { name: '包含角色' }),
  ] as HTMLInputElement[]
}

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
  it('offers JSON, plain text, PNG, a link and a QR code; no CSV or Markdown', () => {
    render(<ExportSheet game={game('a')} open onClose={() => {}} />)
    expect(screen.getAllByRole('radio').map((r) => r.closest('label')!.textContent)).toEqual([
      'JSON',
      '純文字',
      'PNG',
      '連結',
      'QR code',
    ])
  })

  it('previews formats using the naming template for the file name', () => {
    render(<ExportSheet game={game('a', '備註內容')} open onClose={() => {}} />)
    expect(screen.getByText(/檔名：.*第3場\.json/)).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: '純文字' }))
    const preview = screen.getByRole<HTMLTextAreaElement>('textbox', { name: '預覽' })
    expect(preview.value).toMatch(/^【.*第3場】/)
    expect(preview.value).not.toContain('梅林')
    fireEvent.click(screen.getByRole('switch', { name: '包含角色' }))
    expect(screen.getByRole<HTMLTextAreaElement>('textbox', { name: '預覽' }).value).toContain(
      '梅林',
    )
  })

  it('shows the share link, and copies it', async () => {
    const writeText = vi.fn<(t: string) => Promise<void>>(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<ExportSheet game={game('a')} open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('radio', { name: '連結' }))
    const link = await screen.findByRole<HTMLTextAreaElement>('textbox', { name: '分享連結' })
    expect(link.value).toMatch(/\?s=[zj]/)
    expect(screen.queryByRole('switch', { name: '包含角色' })).toBeNull()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /複製連結/ }))
    })
    expect(writeText).toHaveBeenCalledWith(link.value)
  })

  it('draws the share link as a QR code that can be downloaded', async () => {
    render(<ExportSheet game={game('a')} open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('radio', { name: 'QR code' }))
    expect(await screen.findByRole('img', { name: /QR code/ })).toBeTruthy()
    expect(screen.getByText(/檔名：.*第3場-QR\.png/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /下載/ })).toBeTruthy()
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
    expect(styleControls().every((c) => c.matches(':disabled'))).toBe(true)
    await act(async () => png.resolve(new Blob(['x'], { type: 'image/png' })))
    expect(await screen.findByRole('button', { name: /^下載$/ })).toHaveProperty('disabled', false)
    expect(styleControls().some((c) => c.matches(':disabled'))).toBe(false)
  })

  it('leaves the options free while exporting text', () => {
    render(<ExportSheet game={game('a')} open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('radio', { name: '純文字' }))
    expect(styleControls().some((c) => c.matches(':disabled'))).toBe(false)
  })
})

describe('ExportSheet on phones', () => {
  it('pre-renders the PNG and saves it to photos through the share sheet', async () => {
    const share = vi.fn<(data: ShareData) => Promise<void>>(() => Promise.resolve())
    Object.assign(navigator, { share, canShare: () => true })
    window.matchMedia = ((q: string) => ({ matches: q === '(pointer: coarse)' })) as never
    try {
      render(<ExportSheet game={game('a')} open onClose={() => {}} />)
      const rendersBefore = png.pending.started
      fireEvent.click(screen.getByRole('radio', { name: 'PNG' }))
      expect(await screen.findByRole('button', { name: /產生中/ })).toHaveProperty('disabled', true)
      expect(styleControls().every((c) => c.matches(':disabled'))).toBe(true)
      // the PNG starts rendering on the next animation frame
      await vi.waitFor(() => expect(png.pending.started).toBeGreaterThan(rendersBefore))
      await act(async () => png.resolve(new Blob(['x'], { type: 'image/png' })))
      const save = await screen.findByRole('button', { name: /儲存到相簿/ })
      expect(styleControls().some((c) => c.matches(':disabled'))).toBe(false)
      expect(screen.queryByRole('button', { name: '分享' })).toBeNull()
      await act(async () => fireEvent.click(save))
      expect(share).toHaveBeenCalledTimes(1)
      expect(share.mock.calls[0]![0].files![0]!.type).toBe('image/png')
      expect(screen.getByText(/儲存影像/)).toBeTruthy()
    } finally {
      Reflect.deleteProperty(navigator, 'share')
      Reflect.deleteProperty(navigator, 'canShare')
      Reflect.deleteProperty(window, 'matchMedia')
    }
  })
})
