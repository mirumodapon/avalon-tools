import { toolById, tools, type ToolMeta } from '@avalon/registry'
import { describe, expect, it } from 'vitest'
import { cacheIdOf, createPwaConfig, FILE_PATH, pathPattern, PWA_THEME_COLOR } from './config.ts'

const home = toolById('home')
const record = toolById('record')

describe('createPwaConfig', () => {
  it('gives each app its own identity and scope', () => {
    const h = createPwaConfig(home).manifest as Record<string, unknown>
    const r = createPwaConfig(record).manifest as Record<string, unknown>
    expect(h).toMatchObject({
      id: '/',
      start_url: '/',
      scope: '/',
      name: '阿瓦隆工具集',
      short_name: '阿瓦隆',
    })
    expect(r).toMatchObject({
      id: '/record/',
      start_url: '/record/',
      scope: '/record/',
      name: '阿瓦隆・遊戲紀錄',
      short_name: '遊戲紀錄',
    })
    expect(h.theme_color).toBe(PWA_THEME_COLOR)
    expect(h.background_color).toBe(PWA_THEME_COLOR)
  })

  it('uses manifest ids that never repeat across tools', () => {
    const ids = tools.map((t) => (createPwaConfig(t).manifest as { id: string }).id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps home’s service worker away from every nested tool', () => {
    const deny = createPwaConfig(home).workbox!.navigateFallbackDenylist!
    const denied = (p: string) => deny.some((re) => re.test(p))
    expect(denied('/record/')).toBe(true)
    expect(denied('/record')).toBe(true)
    expect(denied('/record/index.html')).toBe(true)
    expect(denied('/recordings/')).toBe(false)
    expect(denied('/')).toBe(false)
    expect(denied('/docs/')).toBe(true)
    expect(denied('/docs/guide/record/setup')).toBe(true)
    for (const t of tools.filter((x) => x.id !== 'home')) expect(denied(t.path)).toBe(true)
  })

  it('leaves files such as licenses.txt to the network in every app', () => {
    for (const t of [home, record]) {
      const deny = createPwaConfig(t).workbox!.navigateFallbackDenylist!
      const denied = (p: string) => deny.some((re) => re.test(p))
      expect(denied(`${t.path}licenses.txt`)).toBe(true)
      // The app's own pages still get the app shell.
      expect(denied(t.path)).toBe(false)
      expect(denied(`${t.path}#/settings`)).toBe(false)
    }
  })

  it('denies only files for a leaf tool', () => {
    expect(createPwaConfig(record).workbox!.navigateFallbackDenylist).toEqual([FILE_PATH])
  })

  it('uses the scope-exact cleanup instead of Workbox’s', () => {
    expect(createPwaConfig(home).workbox).toMatchObject({
      cleanupOutdatedCaches: false,
      importScripts: ['sw-cleanup.js'],
    })
  })

  it('prefixes caches with the app id', () => {
    expect(createPwaConfig(home).workbox!.cacheId).toBe('avalon-home')
    expect(createPwaConfig(record).workbox!.cacheId).toBe('avalon-record')
    expect(cacheIdOf(record)).toBe('avalon-record')
  })

  it('derives the denylist from whatever tools are registered', () => {
    const extra: ToolMeta = { ...record, id: 'demo', path: '/demo/', name: 'Demo' }
    const deny = createPwaConfig(home, {}, [...tools, extra]).workbox!.navigateFallbackDenylist!
    expect(deny.some((re) => re.test('/demo/x'))).toBe(true)
  })

  it('passes extra service worker scripts through', () => {
    expect(createPwaConfig(home, { importScripts: ['cleanup.js'] }).workbox!.importScripts).toEqual(
      ['sw-cleanup.js', 'cleanup.js'],
    )
  })
})

describe('pathPattern', () => {
  it('matches a path with and without the trailing slash', () => {
    expect(pathPattern('/record/').test('/record')).toBe(true)
    expect(pathPattern('/record/').test('/record-x')).toBe(false)
  })
})
