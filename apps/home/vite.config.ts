import { createPwaConfig } from '@avalon/pwa'
import { toolById } from '@avalon/registry'
import { catppuccinThemePlugin } from '@avalon/theme/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const HOME = toolById('home')

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

/** Short commit hash of the build; falls back to the CI SHA or "dev" outside git. */
function gitRev(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev'
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(`${pkg.version}-${gitRev()}`),
  },
  // Served at / (from the tool registry).
  base: HOME.path,
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@tabler/icons-react',
      '@catppuccin/palette',
      'workbox-window',
    ],
  },
  plugins: [
    // 1.x kept the theme inside its settings; read it until the upgrade has run.
    catppuccinThemePlugin({ storageKeys: ['avalon:global:theme', 'avalon-recorder:settings'] }),
    react(),
    tailwindcss(),
    VitePWA(createPwaConfig(HOME)),
  ],
})
