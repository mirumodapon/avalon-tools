import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HOLD_MS } from '@avalon/pass-play'
import { createLocalStore, saveRecord, setRecordStore } from '../history/store.ts'
import { DEFAULT_SETTINGS, useSettings } from '../settings.ts'
import { RecordPage } from './RecordPage.tsx'

const RECT = { left: 0, top: 0, right: 300, bottom: 400, width: 300, height: 400, x: 0, y: 0 }
const ROLES = ['loyal', 'oberon', 'merlin', 'minion', 'loyal', 'assassin', 'percival'] as const

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    ...RECT,
    toJSON: () => RECT,
  })
  setRecordStore(createLocalStore())
  useSettings.setState({
    settings: { ...DEFAULT_SETTINGS, special: [...DEFAULT_SETTINGS.special] },
  })
  await saveRecord({
    id: 'r',
    createdAt: 0,
    kind: 'roles' as const,
    playerCount: 7,
    config: ['merlin', 'percival', 'assassin', 'oberon'],
    assignments: ROLES.map((role, i) => ({ seat: i + 1, role })).toReversed(),
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  setRecordStore(null)
})

async function reveal() {
  render(<RecordPage id="r" />)
  await act(async () => {})
  expect(screen.queryByText('梅林')).toBeNull()
  fireEvent.pointerDown(screen.getByRole('button', { name: '長按顯示全部身分' }), {
    clientX: 5,
    clientY: 5,
  })
  act(() => vi.advanceTimersByTime(HOLD_MS))
}

const seatsIn = (el: HTMLElement) =>
  within(el)
    .getAllByLabelText(/^\d+ 號$/)
    .map((s) => s.textContent)

describe('RecordPage', () => {
  it('lists every seat in seat order with its faction', async () => {
    await reveal()
    const list = screen.getByRole('list')
    expect(seatsIn(list)).toEqual(['1', '2', '3', '4', '5', '6', '7'])
    const items = within(list).getAllByRole('listitem')
    expect(items[1]!.textContent).toBe('2奧伯倫壞人')
    expect(items[2]!.textContent).toBe('3梅林好人')
  })

  it('groups by faction and remembers the choice', async () => {
    await reveal()
    fireEvent.click(screen.getByRole('radio', { name: '依陣營' }))
    const good = screen.getByRole('region', { name: '好人' })
    const evil = screen.getByRole('region', { name: '壞人' })
    expect(seatsIn(good)).toEqual(['1', '3', '5', '7'])
    expect(seatsIn(evil)).toEqual(['2', '4', '6'])
    expect(within(good).getByText('4 人')).toBeTruthy()
    // no faction label per row inside a faction group
    expect(within(good).queryByText('好人', { selector: 'li *' })).toBeNull()
    expect(useSettings.getState().settings.recordView).toBe('faction')
  })
})
