import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end checks against the assembled site (`pnpm build` → dist/), served the
 * way GitHub Pages serves it. Run with `pnpm e2e`; needs `pnpm exec playwright install chromium` once.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4317',
    ...devices['Pixel 7'],
    serviceWorkers: 'allow',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'node scripts/preview.ts --port 4317',
    url: 'http://localhost:4317/',
    reuseExistingServer: false,
  },
})
