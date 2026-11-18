import { catppuccinThemePlugin } from '@avalon/theme/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    catppuccinThemePlugin({ storageKey: 'avalon-recorder:settings' }),
    react(),
    tailwindcss(),
  ],
})
