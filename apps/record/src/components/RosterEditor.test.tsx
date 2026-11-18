import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useSettings } from '../settings/store.ts'
import { RosterEditor } from './RosterEditor.tsx'

afterEach(() => useSettings.getState().reset())

const roster = () => useSettings.getState().settings.roster

describe('RosterEditor', () => {
  it('adds, renames and deletes names', () => {
    render(<RosterEditor />)
    const input = screen.getByRole('textbox', { name: '新增玩家名字' })
    fireEvent.change(input, { target: { value: '阿明' } })
    fireEvent.click(screen.getByRole('button', { name: /新增/ }))
    fireEvent.change(input, { target: { value: '小華' } })
    fireEvent.submit(input)
    expect(roster()).toEqual(['阿明', '小華'])

    fireEvent.change(input, { target: { value: '阿明' } })
    fireEvent.submit(input)
    expect(screen.getByRole('alert').textContent).toContain('已在名冊中')

    fireEvent.click(screen.getByRole('button', { name: '編輯「小華」' }))
    const edit = screen.getByRole('textbox', { name: '修改「小華」' })
    fireEvent.change(edit, { target: { value: '小美' } })
    fireEvent.submit(edit)
    expect(roster()).toEqual(['阿明', '小美'])

    fireEvent.click(screen.getByRole('button', { name: '刪除「阿明」' }))
    expect(roster()).toEqual(['小美'])
  })
})
