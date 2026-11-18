import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'

describe('App', () => {
  it('shows the tool name and links back home', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '__NAME__' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '回到阿瓦隆工具集' }).getAttribute('href')).toBe('/')
  })
})
