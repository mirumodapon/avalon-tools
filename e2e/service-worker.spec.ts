import { expect, test } from '@playwright/test'
import { cacheNames, controlled } from './helpers.ts'

test.describe('one service worker per app', () => {
  test('1. home and record each register their own worker and scope', async ({ page, baseURL }) => {
    await page.goto('/')
    expect(await controlled(page, '/')).toBe(`${baseURL}/sw.js`)
    await page.goto('/record/')
    expect(await controlled(page, '/record/')).toBe(`${baseURL}/record/sw.js`)
    const scopes = await page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistrations()).map((r) => r.scope).toSorted(),
    )
    expect(scopes).toEqual([`${baseURL}/`, `${baseURL}/record/`])
  })

  test('2. both apps open offline from their own caches', async ({ page, context }) => {
    await page.goto('/')
    await controlled(page, '/')
    await page.goto('/record/')
    await controlled(page, '/record/')
    await context.setOffline(true)
    await page.goto('/')
    await expect(page).toHaveTitle('阿瓦隆工具集')
    await expect(page.getByRole('link', { name: /遊戲紀錄/ })).toBeVisible()
    await page.goto('/record/')
    await expect(page).toHaveTitle('阿瓦隆・遊戲紀錄')
    await expect(page.getByRole('button', { name: /開新局/ })).toBeVisible()
  })

  test('3. home’s worker never answers for /record/', async ({ page, context }) => {
    await page.goto('/')
    await controlled(page, '/')
    await context.setOffline(true)
    // Without record's own worker the navigation must fail, not show home's index.html.
    await expect(page.goto('/record/')).rejects.toThrow()
    await context.setOffline(false)
  })

  test('4. home clears the 1.x cache but never record’s', async ({ page, baseURL }) => {
    await page.goto('/record/')
    await controlled(page, '/record/')
    const v1 = `workbox-precache-v2-${baseURL}/`
    await page.evaluate(async (name) => {
      const c = await caches.open(name)
      await c.put('/index.html', new Response('<title>阿瓦隆紀錄</title>'))
    }, v1)
    await page.goto('/')
    await controlled(page, '/')
    await expect.poll(() => cacheNames(page)).not.toContain(v1)
    const names = await cacheNames(page)
    expect(names).toContain(`avalon-record-precache-v2-${baseURL}/record/`)
    expect(names).toContain(`avalon-home-precache-v2-${baseURL}/`)
  })
})
