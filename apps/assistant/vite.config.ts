import { thirdPartyLicensesPlugin } from '@avalon/licenses'
import { avalonPwa, buildVersion } from '@avalon/pwa'
import { manifestName, toolById } from '@avalon/registry'
import { catppuccinThemePlugin } from '@avalon/theme/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const TOOL = toolById('assistant')

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion()),
  },
  // Served at the tool's registry path.
  base: TOOL.path,
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@tabler/icons-react',
      'workbox-window',
    ],
  },
  plugins: [
    // 1.x kept the theme inside its settings; read it until the upgrade has run.
    catppuccinThemePlugin({ storageKeys: ['avalon:global:theme', 'avalon-recorder:settings'] }),
    react(),
    tailwindcss(),
    avalonPwa(TOOL),
    thirdPartyLicensesPlugin(manifestName(TOOL)),
  ],
})
