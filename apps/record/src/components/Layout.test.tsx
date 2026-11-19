import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Page } from './Layout.tsx'

const HOME = '回到阿瓦隆工具集'

describe('Page', () => {
  it('links to the tool home only from the top-level list', () => {
    render(<Page title="阿瓦隆紀錄">列表</Page>)
    expect(screen.getByRole('link', { name: HOME })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '返回' })).toBeNull()
  })

  it('shows only the back button on every other screen', () => {
    render(
      <Page title="設定" back={{ name: 'home' }}>
        內容
      </Page>,
    )
    expect(screen.queryByRole('link', { name: HOME })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(window.location.hash).toBe('#/')
  })

  it('runs a custom back action', () => {
    const onBack = vi.fn<() => void>()
    render(
      <Page title="分享的紀錄" onBack={onBack}>
        內容
      </Page>,
    )
    expect(screen.queryByRole('link', { name: HOME })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(onBack).toHaveBeenCalledOnce()
  })
})
