import { expect, type Page } from '@playwright/test'

/**
 * Waits until the page is controlled by the worker registered for its own scope and
 * returns that worker's script URL. On a first visit the page is controlled by an
 * outer worker (or none), so it reloads once, as a returning user would.
 */
export async function controlled(page: Page, scope: string): Promise<string> {
  // Look the app's registration up by scope: `ready` and getRegistration() report
  // whichever (outer) registration matches before the app's own one exists.
  const ownScript = () =>
    page.evaluate(async (path) => {
      const want = new URL(path, location.href).href
      const reg = (await navigator.serviceWorker.getRegistrations()).find((r) => r.scope === want)
      return reg?.active?.state === 'activated' ? reg.active.scriptURL : null
    }, scope)
  await expect.poll(ownScript, { timeout: 10_000 }).not.toBeNull()
  const script = (await ownScript())!
  if ((await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)) !== script) {
    await page.reload()
  }
  return page.evaluate(() => navigator.serviceWorker.controller!.scriptURL)
}

export function cacheNames(page: Page): Promise<string[]> {
  return page.evaluate(async () => (await caches.keys()).toSorted())
}
