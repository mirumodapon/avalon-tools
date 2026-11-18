import { createGame, defaultPlayerNames, makePlayers } from '@avalon/record-core'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShareButton } from './ShareButton.tsx'

const game = createGame({
  id: 'g',
  now: '2026-11-18T10:00:00Z',
  players: makePlayers(defaultPlayerNames(5)),
  name: { custom: '週五團' },
})

afterEach(() => Reflect.deleteProperty(navigator, 'share'))

describe('ShareButton', () => {
  it('shows the link as text or QR code and shares it', async () => {
    const share = vi.fn<(d: ShareData) => Promise<void>>(() => Promise.resolve())
    Object.assign(navigator, { share })
    render(<ShareButton game={game} />)
    fireEvent.click(screen.getByRole('button', { name: '分享' }))
    const dialog = await screen.findByRole('dialog', { name: '分享連結' })
    const link = within(dialog).getByRole<HTMLTextAreaElement>('textbox', {
      name: '分享連結',
    }).value
    expect(link).toMatch(/\?s=[zj]/)

    fireEvent.click(within(dialog).getByRole('radio', { name: 'QR code' }))
    const qr = await within(dialog).findByRole('img', { name: /QR code/ })
    expect(qr.querySelector('path')?.getAttribute('d')?.length).toBeGreaterThan(100)

    fireEvent.click(within(dialog).getByRole('button', { name: '用其他 App 分享' }))
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: link }))
  })
})
