import { act, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { parseRoute } from './router.ts'
import { TOOL_ICONS } from './toolIcons.ts'
import { tools } from '@avalon/registry'

function at(path: string) {
  act(() => {
    window.history.replaceState(null, '', path)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

afterEach(() => at('/'))

describe('home', () => {
  it('lists every tool from the registry; coming-soon tools are not links', () => {
    render(<App />)
    const list = screen.getByRole('list', { name: '工具' })
    const record = within(list).getByRole('link', { name: /遊戲紀錄/ })
    expect(record.getAttribute('href')).toBe('/record/')
    expect(within(list).queryByRole('link', { name: /夜晚旁白/ })).toBeNull()
    expect(within(list).getByText('夜晚旁白').closest('[aria-disabled="true"]')).toBeTruthy()
    expect(within(list).getAllByText('即將推出').length).toBeGreaterThan(0)
    expect(within(list).queryByText('阿瓦隆工具集')).toBeNull()
  })

  it('has no settings, only an info page with versions and the changelog', async () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: /設定/ })).toBeNull()
    act(() => screen.getByRole('button', { name: '資訊' }).click())
    expect(await screen.findByRole('heading', { name: '資訊' })).toBeTruthy()
    expect(screen.getByText('阿瓦隆工具集')).toBeTruthy()
    expect(screen.getByText('遊戲紀錄')).toBeTruthy()
    expect(screen.getByRole('heading', { name: '更新紀錄' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '儲存空間' })).toBeTruthy()
  })

  it('shows a 404 with a way home for unknown paths', () => {
    at('/nope')
    render(<App />)
    expect(screen.getByText('找不到這個頁面')).toBeTruthy()
    expect(screen.getByRole('link', { name: '回到阿瓦隆工具集' }).getAttribute('href')).toBe('/')
  })

  it('has an icon for every registry tool', () => {
    expect(tools.filter((t) => !TOOL_ICONS[t.icon]).map((t) => t.icon)).toEqual([])
  })
})

describe('parseRoute', () => {
  it('maps paths and hashes', () => {
    expect(parseRoute('/', '')).toEqual({ name: 'tools' })
    expect(parseRoute('/', '#/info')).toEqual({ name: 'info' })
    expect(parseRoute('/index.html', '#/')).toEqual({ name: 'tools' })
    expect(parseRoute('/whatever', '')).toEqual({ name: 'notFound' })
    expect(parseRoute('/', '#/nope')).toEqual({ name: 'notFound' })
  })
})
