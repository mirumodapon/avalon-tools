import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { UPGRADE_NOTICE_KEY, UpgradeCard } from './UpgradeCard.tsx'

function standalone(on: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q.includes('standalone') }))
}

afterEach(() => vi.unstubAllGlobals())

const TITLE = '阿瓦隆紀錄升級為阿瓦隆工具集'

describe('UpgradeCard', () => {
  it('shows once in an installed 1.x app, then never again', () => {
    standalone(true)
    localStorage.setItem('avalon-recorder:settings', '{}')
    const { unmount } = render(<UpgradeCard />)
    expect(screen.getByText(TITLE)).toBeTruthy()
    expect(screen.getByRole('link', { name: '打開遊戲紀錄' }).getAttribute('href')).toBe('/record/')
    act(() => screen.getByRole('button', { name: '知道了' }).click())
    expect(screen.queryByText(TITLE)).toBeNull()
    expect(localStorage.getItem(UPGRADE_NOTICE_KEY)).not.toBeNull()
    unmount()
    render(<UpgradeCard />)
    expect(screen.queryByText(TITLE)).toBeNull()
    // only home's own key was written
    expect(localStorage.getItem('avalon-recorder:settings')).toBe('{}')
  })

  it('stays hidden in a browser tab', () => {
    standalone(false)
    localStorage.setItem('avalon-recorder:settings', '{}')
    render(<UpgradeCard />)
    expect(screen.queryByText(TITLE)).toBeNull()
  })

  it('stays hidden for new 2.x users', () => {
    standalone(true)
    render(<UpgradeCard />)
    expect(screen.queryByText(TITLE)).toBeNull()
  })
})
