import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const backup = JSON.parse(
  readFileSync(
    new URL('../apps/record/src/test/fixtures/v1.9.1-backup.json', import.meta.url),
    'utf8',
  ),
) as { id: string; createdAt: string; updatedAt: string; schemaVersion: number }[]
const LIVE = backup.find((g) => g.id.startsWith('c7d1'))!

test.use({ serviceWorkers: 'block' })

test('a 1.9.1 user’s bookmark, settings and games survive the upgrade', async ({ page }) => {
  // Leave exactly what 1.9.1 stored at this origin.
  await page.goto('/404-seed')
  await page.evaluate(async (games) => {
    localStorage.setItem(
      'avalon-recorder:settings',
      JSON.stringify({
        version: 1,
        data: { theme: { mode: 'light', accent: 'peach' }, roster: ['阿明'] },
      }),
    )
    await new Promise<void>((ok, fail) => {
      const open = indexedDB.open('avalon-recorder', 10)
      open.addEventListener('upgradeneeded', () => {
        const store = open.result.createObjectStore('games', { keyPath: 'id' })
        for (const i of ['createdAt', 'date', 'winner', 'updatedAt']) store.createIndex(i, i)
      })
      open.addEventListener('success', () => {
        const tx = open.result.transaction('games', 'readwrite')
        for (const game of games) {
          tx.objectStore('games').put({
            id: game.id,
            createdAt: game.createdAt,
            date: game.createdAt.slice(0, 10),
            winner: 'none',
            updatedAt: game.updatedAt,
            schemaVersion: game.schemaVersion,
            game,
          })
        }
        tx.addEventListener('complete', () => {
          open.result.close()
          ok()
        })
        tx.addEventListener('error', () => fail(tx.error))
      })
    })
  }, backup)

  await page.goto(`/#/play/${LIVE.id}`)
  await page.waitForURL(`**/record/#/play/${LIVE.id}`)
  await expect(page.getByText('任務 1')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.dataset.flavor)).toBe('latte')
  expect(await page.evaluate(() => document.documentElement.dataset.accent)).toBe('peach')

  await page.goto('/record/#/')
  await expect(page.getByText('萬聖節團')).toBeVisible()

  // 1.x share links land in the record tool too.
  await page.goto('/?s=abc')
  await page.waitForURL('**/record/?s=abc')
  // The old data is kept for one release.
  expect(await page.evaluate(() => localStorage.getItem('avalon-recorder:settings'))).not.toBeNull()
})
