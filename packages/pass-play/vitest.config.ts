import { fileURLToPath } from 'node:url'
import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    alias: {
      // @avalon/ui pulls in the PWA update prompt; its virtual module only exists in an app build.
      'virtual:pwa-register/react': fileURLToPath(
        new URL('../ui/src/test/pwa-register-mock.ts', import.meta.url),
      ),
    },
  },
  test: {
    name: 'pass-play',
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
