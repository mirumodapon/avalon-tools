import { act, render, screen } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHECK_TIMEOUT_MS, UpdateGate } from './UpdateGate.tsx'

interface Options {
  onRegisteredSW?: (url: string, r: ServiceWorkerRegistration | undefined) => void
}

/** Controllable stand-in for vite-plugin-pwa's hook. */
const sw = vi.hoisted(() => ({
  registration: undefined as unknown,
  applied: 0,
  setNeedRefresh: (_v: boolean) => {},
}))
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW(options: Options) {
    const [needRefresh, setNeedRefresh] = useState(false)
    sw.setNeedRefresh = setNeedRefresh
    useEffect(() => {
      options.onRegisteredSW?.('/sw.js', sw.registration as ServiceWorkerRegistration)
      // eslint-disable-next-line react-hooks/exhaustive-deps -- registers once
    }, [])
    return {
      needRefresh: [needRefresh, setNeedRefresh],
      offlineReady: [false, () => {}],
      updateServiceWorker: async () => {
        sw.applied++
      },
    }
  },
}))

function fakeRegistration({ waiting = false, finds = false } = {}) {
  const incoming = Object.assign(new EventTarget(), { state: 'installing' })
  return {
    waiting: waiting ? {} : null,
    installing: null as unknown,
    update: vi.fn<() => Promise<void>>(async function (this: { installing: unknown }) {
      if (finds) this.installing = incoming
    }),
    incoming,
  }
}

beforeEach(() => {
  sw.applied = 0
  Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true })
})
afterEach(() => {
  Reflect.deleteProperty(navigator, 'serviceWorker')
  vi.useRealTimers()
})

const app = <p>主畫面</p>

describe('UpdateGate', () => {
  it('shows the check and gets out of the way when there is no update', async () => {
    sw.registration = fakeRegistration()
    render(<UpdateGate enabled>{app}</UpdateGate>)
    expect(screen.queryByText('檢查更新中…') ?? screen.queryByText('主畫面')).toBeTruthy()
    await act(async () => {})
    expect(screen.queryByText('檢查更新中…')).toBeNull()
    expect(screen.getByText('主畫面')).toBeTruthy()
  })

  it('applies a waiting update immediately', async () => {
    sw.registration = fakeRegistration({ waiting: true })
    render(<UpdateGate enabled>{app}</UpdateGate>)
    expect(screen.getByText('檢查更新中…')).toBeTruthy()
    act(() => sw.setNeedRefresh(true)) // vite-plugin-pwa reports the waiting worker
    expect(screen.getByText('APP 更新中…')).toBeTruthy()
    expect(sw.applied).toBe(1)
  })

  it('applies an update found while checking', async () => {
    const r = fakeRegistration({ finds: true })
    sw.registration = r
    render(<UpdateGate enabled>{app}</UpdateGate>)
    await act(async () => {})
    expect(r.update).toHaveBeenCalled()
    expect(screen.getByText('檢查更新中…')).toBeTruthy()
    act(() => sw.setNeedRefresh(true)) // new worker installed
    expect(screen.getByText('APP 更新中…')).toBeTruthy()
    expect(sw.applied).toBe(1)
  })

  it('never blocks longer than the timeout', async () => {
    vi.useFakeTimers()
    sw.registration = { waiting: null, installing: null, update: () => new Promise(() => {}) }
    render(<UpdateGate enabled>{app}</UpdateGate>)
    expect(screen.getByText('檢查更新中…')).toBeTruthy()
    await act(async () => {
      vi.advanceTimersByTime(CHECK_TIMEOUT_MS)
    })
    expect(screen.queryByText('檢查更新中…')).toBeNull()
  })

  it('does nothing when disabled (dev server)', () => {
    render(<UpdateGate enabled={false}>{app}</UpdateGate>)
    expect(screen.queryByText('檢查更新中…')).toBeNull()
  })
})
