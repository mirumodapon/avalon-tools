import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Select } from './Select.tsx'

function Harness() {
  const [v, setV] = useState<'a' | 'b'>('a')
  return (
    <Select
      label="水果"
      value={v}
      options={[
        { value: 'a', label: '蘋果' },
        { value: 'b', label: '香蕉' },
      ]}
      onChange={setV}
    />
  )
}

describe('Select', () => {
  it('opens a sheet and picks an option', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: '水果：蘋果' }))
    const dialog = screen.getByRole('dialog', { name: '水果' })
    expect(within(dialog).getByRole('button', { name: '蘋果' })).toHaveProperty(
      'ariaPressed',
      'true',
    )
    fireEvent.click(within(dialog).getByRole('button', { name: '香蕉' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: '水果：香蕉' })).toBeTruthy()
  })
})
