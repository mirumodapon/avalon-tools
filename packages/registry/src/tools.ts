import type { ToolMeta } from './types.ts'

/**
 * Single source of truth for every tool. Home, the build script, PWA config and
 * icon generation all read this list. `pnpm new:app <id>` appends to it.
 */
export const TOOLS = [
  {
    id: 'home',
    name: '阿瓦隆工具集',
    shortName: '阿瓦隆',
    description: '阿瓦隆桌遊的輔助工具',
    path: '/',
    icon: 'IconBuildingCastle',
    accent: 'mauve',
    status: 'stable',
  },
  {
    id: 'record',
    name: '遊戲紀錄',
    shortName: '遊戲紀錄',
    description: '依序記錄組隊、投票、任務與湖中女神，賽後回顧、匯出與分享',
    path: '/record/',
    icon: 'IconClipboardList',
    accent: 'green',
    status: 'beta',
  },
  {
    id: 'narrator',
    name: '夜晚旁白',
    shortName: '夜晚旁白',
    description: '依角色配置唸出夜晚階段的旁白',
    path: '/narrator/',
    icon: 'IconMoonStars',
    accent: 'lavender',
    status: 'coming-soon',
  },
  {
    id: 'deal',
    name: '角色發牌',
    shortName: '角色發牌',
    description: '一支手機輪流傳遞，讓每位玩家查看自己的身分',
    path: '/deal/',
    icon: 'IconCards',
    accent: 'peach',
    status: 'rc',
  },
  {
    id: 'assistant',
    name: '單機遊戲助手',
    shortName: '遊戲助手',
    description: '把發牌、夜晚旁白、出任務與遊戲紀錄串成一場完整的遊戲',
    path: '/assistant/',
    icon: 'IconApps',
    accent: 'sapphire',
    status: 'beta',
  },
  {
    id: 'docs',
    name: '使用說明',
    shortName: '使用說明',
    description: '各工具的操作說明、遊戲規則與開發者文件',
    path: '/docs/',
    icon: 'IconHelpCircle',
    accent: 'blue',
    status: 'stable',
    kind: 'docs',
  },
  // new:app inserts here
] as const satisfies readonly ToolMeta[]

export type ToolId = (typeof TOOLS)[number]['id']
