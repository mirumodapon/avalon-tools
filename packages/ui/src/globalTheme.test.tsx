import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  getGlobalTheme,
  reloadGlobalTheme,
  setGlobalTheme,
  THEME_STORE,
  useGlobalTheme,
} from './globalTheme.ts'

afterEach(() => {
  localStorage.clear()
  reloadGlobalTheme()
})

function Show() {
  const [theme] = useGlobalTheme()
  return <p>{`${theme.mode}/${theme.accent}`}</p>
}

describe('global theme', () => {
  it('lives in avalon:global:theme (the key the anti-flash script reads)', () => {
    expect(THEME_STORE.key).toBe('avalon:global:theme')
    setGlobalTheme({ accent: 'teal' })
    expect(JSON.parse(localStorage.getItem('avalon:global:theme')!).data.accent).toBe('teal')
  })

  it('follows changes made by another app or tab', () => {
    render(<Show />)
    expect(screen.getByText('system/mauve')).toBeTruthy()
    localStorage.setItem(
      'avalon:global:theme',
      JSON.stringify({ version: 1, data: { mode: 'dark', accent: 'green' } }),
    )
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'avalon:global:theme' }))
    })
    expect(screen.getByText('dark/green')).toBeTruthy()
    expect(getGlobalTheme()).toEqual({ mode: 'dark', accent: 'green' })
  })
})
