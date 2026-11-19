import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Segmented, Switch } from './ui.tsx'

const OPTIONS = [
  { value: 'a', label: '甲' },
  { value: 'b', label: '乙' },
] as const

describe('disabled controls', () => {
  // jsdom still dispatches clicks to disabled inputs, so only the state is checked here;
  // browsers ignore them.
  it('Segmented disables every option', () => {
    render(<Segmented label="方式" value="a" options={OPTIONS} onChange={() => {}} disabled />)
    for (const name of ['甲', '乙']) {
      expect((screen.getByRole('radio', { name }) as HTMLInputElement).matches(':disabled')).toBe(
        true,
      )
    }
  })

  it('Switch disables its input', () => {
    render(<Switch label="包含角色" checked={false} onChange={() => {}} disabled />)
    expect((screen.getByRole('switch', { name: '包含角色' }) as HTMLInputElement).disabled).toBe(
      true,
    )
  })

  it('stay enabled by default', () => {
    render(<Switch label="包含角色" checked={false} onChange={() => {}} />)
    expect((screen.getByRole('switch', { name: '包含角色' }) as HTMLInputElement).disabled).toBe(
      false,
    )
  })
})
