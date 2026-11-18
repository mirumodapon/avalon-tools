import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('./run.ts', () => ({
  runMigration: () => Promise.resolve({ status: 'failed', error: 'quota exceeded' }),
}))

describe('MigrationNotice', () => {
  it('offers a backup of the 1.x data when the upgrade failed', async () => {
    const { MigrationNotice } = await import('./MigrationNotice.tsx')
    render(<MigrationNotice />)
    expect(await screen.findByText('舊版資料搬移失敗')).toBeTruthy()
    expect(screen.getByRole('button', { name: /匯出舊資料備份/ })).toBeTruthy()
    expect(screen.getByText('quota exceeded')).toBeTruthy()
  })
})
