import { createGame, defaultPlayerNames, makePlayers } from '@avalon/core'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../App.tsx'
import { MemoryGameRepository } from '../db/memory.ts'
import { setRepository, useGames } from '../games/store.ts'
import { shareParamFromText, shareUrl, validScannedShare } from './link.ts'

const game = createGame({
  id: 'g1',
  now: '2026-11-18T10:00:00Z',
  players: makePlayers(defaultPlayerNames(5)),
  name: { custom: '朋友的局' },
})

describe('scanned text', () => {
  it('extracts the payload from any share link', async () => {
    const link = await shareUrl(game)
    expect(shareParamFromText(link)).toMatch(/^[zj]/)
    expect(shareParamFromText('https://other.example/avalon/?s=jabc')).toBe('jabc')
    expect(shareParamFromText('hello')).toBeNull()
    expect(shareParamFromText('https://example.com/?q=1')).toBeNull()
  })

  it('only accepts payloads that decode into a game', async () => {
    expect(await validScannedShare(await shareUrl(game))).toMatch(/^[zj]/)
    expect(await validScannedShare('https://example.com/?s=zbroken')).toBeNull()
    expect(await validScannedShare('WIFI:S:home;T:WPA;P:secret;;')).toBeNull()
  })
})

/** Fake camera + native detector that "sees" whatever is in `scanned.text`. */
const scanned: { text: string | null } = { text: null }
class FakeDetector {
  static getSupportedFormats = () => Promise.resolve(['qr_code'])
  detect = () => Promise.resolve(scanned.text ? [{ rawValue: scanned.text }] : [])
}

let repo: MemoryGameRepository
beforeEach(() => {
  repo = new MemoryGameRepository()
  setRepository(repo)
  scanned.text = null
  Object.assign(globalThis, { BarcodeDetector: FakeDetector })
  Object.assign(navigator, {
    mediaDevices: {
      getUserMedia: () => Promise.resolve({ getTracks: () => [{ stop: () => {} }] }),
    },
  })
  HTMLMediaElement.prototype.play = () => Promise.resolve()
})
afterEach(() => {
  Reflect.deleteProperty(globalThis, 'BarcodeDetector')
  Reflect.deleteProperty(navigator, 'mediaDevices')
  window.history.replaceState(null, '', '/')
  setRepository(null)
  useGames.setState({ games: [] })
})

async function openScanner() {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '掃描 QR' }))
  await screen.findByText('將分享的 QR code 對準方框')
}

describe('QR scanner', () => {
  it('opens the shared game preview after scanning a share link', async () => {
    await openScanner()
    scanned.text = await shareUrl(game)
    expect(await screen.findByText('別人分享給你的紀錄')).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: '掃描 QR code' })).toBeNull()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /匯入到本機/ }))
    })
    expect(repo.data.get('g1')?.name.custom).toBe('朋友的局')
  })

  it('shows 掃描失敗 for codes that are not this app’s share links, and can retry', async () => {
    await openScanner()
    scanned.text = 'https://example.com/menu'
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('掃描失敗')
    expect(alert.textContent).toContain('這不是阿瓦隆紀錄的分享 QR code')
    scanned.text = null
    fireEvent.click(within(alert).getByRole('button', { name: /重新掃描/ }))
    expect(await screen.findByText('將分享的 QR code 對準方框')).toBeTruthy()
  })

  it('explains when the camera is unavailable', async () => {
    Object.assign(navigator, {
      mediaDevices: {
        getUserMedia: () => Promise.reject(new DOMException('denied', 'NotAllowedError')),
      },
    })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '掃描 QR' }))
    expect((await screen.findByRole('alert')).textContent).toContain('無法使用相機')
  })
})
