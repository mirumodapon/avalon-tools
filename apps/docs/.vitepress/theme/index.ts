import { THEME_STORE } from '@avalon/ui/theme-store'
import { useData, type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import { onMounted, watch } from 'vue'
import { flavorFor, VP_APPEARANCE_KEY, writeBackMode } from './appearance.ts'
import { ExportFieldTable } from './components/ExportFieldTable.ts'
import {
  DefaultConfigTable,
  FactionCountTable,
  QuestSizeTable,
  RoleTable,
  VisionTable,
} from './components/RulesTables.ts'
import { ToolLinks } from './components/ToolLinks.ts'
import { ToolTable } from './components/ToolTable.ts'
import { Mermaid } from './Mermaid.ts'
import '@avalon/theme/flavors.css'
import './custom.css'

function sync(dark: boolean) {
  document.documentElement.dataset.flavor = flavorFor(dark)
  try {
    writeBackMode(localStorage, THEME_STORE.key, THEME_STORE.version)
  } catch {
    // storage unavailable: the docs still follow the toggle
  }
}

/** Keeps `<html data-flavor>` and the tools' shared theme in step with VitePress's toggle. */
function useSharedTheme() {
  const { isDark } = useData()
  onMounted(() => {
    sync(isDark.value)
    watch(isDark, sync)
    // Another tab (a tool or the docs) changed the theme.
    window.addEventListener('storage', (e) => {
      if (e.key !== THEME_STORE.key || e.newValue === null) return
      try {
        const mode = JSON.parse(e.newValue)?.data?.mode
        const appearance = mode === 'light' || mode === 'dark' ? mode : 'auto'
        if (localStorage.getItem(VP_APPEARANCE_KEY) === appearance) return
        localStorage.setItem(VP_APPEARANCE_KEY, appearance)
        isDark.value =
          appearance === 'auto'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : appearance === 'dark'
      } catch {
        // ignore malformed values
      }
    })
  })
}

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Mermaid', Mermaid)
    app.component('QuestSizeTable', QuestSizeTable)
    app.component('FactionCountTable', FactionCountTable)
    app.component('RoleTable', RoleTable)
    app.component('VisionTable', VisionTable)
    app.component('DefaultConfigTable', DefaultConfigTable)
    app.component('ExportFieldTable', ExportFieldTable)
    app.component('ToolTable', ToolTable)
    app.component('ToolLinks', ToolLinks)
  },
  setup() {
    useSharedTheme()
  },
} satisfies Theme
