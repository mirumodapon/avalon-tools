import type { Plugin } from 'vite'
import { themeBootstrapScript, type BootstrapOptions } from './bootstrap.ts'

/** Injects the anti-FOUC theme bootstrap script at the top of `<head>`. */
export function catppuccinThemePlugin(options: BootstrapOptions): Plugin {
  return {
    name: 'avalon:catppuccin-theme',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          children: themeBootstrapScript(options),
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}
