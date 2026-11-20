import { toolById } from '@avalon/registry'
import { themeBootstrapScript } from '@avalon/theme'
import { THEME_STORE } from '@avalon/ui/theme-store'
import { defineConfig, type DefaultTheme } from 'vitepress'
import { appearanceBootstrapScript } from './theme/appearance.ts'
import { mermaidFence } from './theme/mermaidFence.ts'

const DOCS = toolById('docs')

const guide: DefaultTheme.SidebarItem[] = [
  {
    text: '開始使用',
    items: [
      { text: '開啟與安裝', link: '/guide/getting-started' },
      { text: '常見問題', link: '/guide/faq' },
    ],
  },
  {
    text: '遊戲紀錄',
    items: [
      { text: '總覽', link: '/guide/record/' },
      { text: '開局設定', link: '/guide/record/setup' },
      { text: '組隊與投票', link: '/guide/record/voting' },
      { text: '任務與刺殺', link: '/guide/record/mission' },
      { text: '修改紀錄', link: '/guide/record/editing' },
      { text: '保存、匯出與匯入', link: '/guide/record/import-export' },
    ],
  },
  {
    text: '角色發牌',
    items: [
      { text: '總覽', link: '/guide/dealer/' },
      { text: '角色配置', link: '/guide/dealer/config' },
      { text: '傳手機流程', link: '/guide/dealer/flow' },
      { text: '歷史紀錄', link: '/guide/dealer/history' },
    ],
  },
]

const rules: DefaultTheme.SidebarItem[] = [
  {
    text: '規則',
    items: [
      { text: '遊戲流程與名詞', link: '/rules/basics' },
      { text: '人數與出隊', link: '/rules/player-count' },
      { text: '角色與視野', link: '/rules/roles' },
    ],
  },
]

const dev: DefaultTheme.SidebarItem[] = [
  {
    text: '開發者',
    items: [
      { text: '架構', link: '/dev/architecture' },
      { text: '常用指令', link: '/dev/commands' },
      { text: '新增工具', link: '/dev/new-app' },
      { text: '資料儲存', link: '/dev/storage' },
      { text: 'PWA 與快取', link: '/dev/pwa' },
      { text: '匯出格式', link: '/dev/export-format' },
      { text: '貢獻流程', link: '/dev/contributing' },
    ],
  },
]

export default defineConfig({
  // Served at /docs/ (from the tool registry), next to the tools.
  base: DOCS.path,
  // GitHub Pages serves /docs/guide/faq.html for /docs/guide/faq.
  cleanUrls: true,
  lang: 'zh-TW',
  title: '阿瓦隆工具集說明',
  description: DOCS.description,
  srcExclude: ['README.md', '**/*.test.ts'],
  outDir: 'dist',
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    // Before VitePress's own dark-mode check: carry the tools' shared theme over to it.
    ['script', { id: 'avalon-theme' }, themeBootstrapScript({ storageKeys: [THEME_STORE.key] })],
    ['script', { id: 'avalon-appearance' }, appearanceBootstrapScript(THEME_STORE.key)],
  ],
  markdown: {
    config: (md) => mermaidFence(md),
  },
  themeConfig: {
    nav: [
      { text: '使用說明', link: '/guide/getting-started', activeMatch: '^/guide/' },
      { text: '規則', link: '/rules/basics', activeMatch: '^/rules/' },
      { text: '開發者', link: '/dev/architecture', activeMatch: '^/dev/' },
      { text: '更新紀錄', link: '/changelog' },
    ],
    sidebar: {
      '/guide/': guide,
      '/rules/': rules,
      '/dev/': dev,
    },
    outline: { level: [2, 3], label: '本頁內容' },
    docFooter: { prev: '上一頁', next: '下一頁' },
    lastUpdated: {
      text: '最後更新',
      formatOptions: { dateStyle: 'medium', timeStyle: 'short', forceLocale: true },
    },
    returnToTopLabel: '回到頂端',
    sidebarMenuLabel: '目錄',
    darkModeSwitchLabel: '深色模式',
    lightModeSwitchTitle: '切換為淺色',
    darkModeSwitchTitle: '切換為深色',
    skipToContentLabel: '跳到內容',
    langMenuLabel: '語言',
    notFound: {
      title: '找不到這個頁面',
      quote: '網址可能打錯了，或這一頁已經搬家。',
      linkLabel: '回到說明首頁',
      linkText: '回到說明首頁',
    },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜尋', buttonAriaLabel: '搜尋文件' },
          modal: {
            displayDetails: '顯示詳細內容',
            resetButtonTitle: '清除搜尋',
            backButtonTitle: '關閉搜尋',
            noResultsText: '找不到相關結果',
            footer: {
              selectText: '開啟',
              selectKeyAriaLabel: 'Enter',
              navigateText: '移動',
              navigateUpKeyAriaLabel: '上方向鍵',
              navigateDownKeyAriaLabel: '下方向鍵',
              closeText: '關閉',
              closeKeyAriaLabel: 'Esc',
            },
          },
        },
      },
    },
  },
  vite: {
    // Workspace packages ship TypeScript sources: bundle them instead of loading them in Node.
    ssr: { noExternal: [/^@avalon\//] },
  },
})
