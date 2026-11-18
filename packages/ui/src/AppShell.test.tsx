import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell.tsx'
import { markHomeWindow } from './standalone.ts'

describe('AppShell', () => {
  it('always offers a full-page link back to the tool home', () => {
    render(<AppShell title="遊戲紀錄">內容</AppShell>)
    expect(screen.getByRole('link', { name: '回到阿瓦隆工具集' }).getAttribute('href')).toBe('/')
    expect(screen.queryByRole('button', { name: '返回' })).toBeNull()
  })

  it('adds the in-app back button when given', () => {
    const onBack = vi.fn<() => void>()
    render(
      <AppShell title="設定" onBack={onBack}>
        內容
      </AppShell>,
    )
    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('hides the home link inside the home app', () => {
    render(
      <AppShell title="阿瓦隆工具集" homeHref={null}>
        內容
      </AppShell>,
    )
    expect(screen.queryByRole('link', { name: '回到阿瓦隆工具集' })).toBeNull()
  })

  describe('installed as an app', () => {
    beforeEach(() =>
      vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('standalone') })),
    )
    afterEach(() => {
      vi.unstubAllGlobals()
      sessionStorage.clear()
    })

    it('hides the home link in a tool installed on its own', () => {
      render(<AppShell title="遊戲紀錄">內容</AppShell>)
      expect(screen.queryByRole('link', { name: '回到阿瓦隆工具集' })).toBeNull()
    })

    it('keeps it when the tool was opened from the installed home', () => {
      markHomeWindow()
      render(<AppShell title="遊戲紀錄">內容</AppShell>)
      expect(screen.getByRole('link', { name: '回到阿瓦隆工具集' }).getAttribute('href')).toBe('/')
    })
  })
})
