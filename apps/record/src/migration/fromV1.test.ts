import {
  createGame,
  defaultRoleConfig,
  gameReducer,
  makePlayers,
  parseGamesJson,
  uniformVotes,
  votesFromApprovals,
  type Game,
} from '@avalon/record-core'
import { reloadGlobalTheme, THEME_STORE } from '@avalon/ui'
import { readStore } from '@avalon/storage'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AvalonDB, toRecord } from '../db/dexie.ts'
import { DEFAULT_SETTINGS, readSettings } from '../settings/settings.ts'
import { CLEANUP_FLAG, exportLegacyBackup, LEGACY, MIGRATED_FLAG, migrateFromV1 } from './fromV1.ts'

/** Settings exactly as 1.9.1 stored them (one envelope, theme inside). */
const V1_SETTINGS = {
  version: 1,
  data: {
    theme: { mode: 'dark', accent: 'teal' },
    defaultInputMode: 'anomalies',
    forcedAutoApprove: false,
    roster: ['阿明', '小華', '小美'],
    naming: { template: '{date} #{seq}', dateFormat: 'MM/DD' },
    viewMode: 'anomaly',
    showRoles: true,
    display: { questResult: 'detailed', ladyResult: 'simple', ladyLayout: 'separate' },
  },
}
const V1_SESSION = { hash: '#/play/g-live', scroll: { '#/play/g-live': 120 } }
const V1_DRAFT = {
  key: 'g-live:q0:a2',
  value: { team: ['p1', 'p3'], mode: 'approvals', flags: ['p2'], touched: true },
}

const ids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']

function buildFinishedGame(): Game {
  let g = createGame({
    id: '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f',
    now: '2026-11-01T12:00:00.000Z',
    players: makePlayers(['阿明', '小華', '小美', '大雄', '靜香', '胖虎', '小夫']),
    name: { custom: '週五團', auto: '2026-11-01 第1場', seq: 1 },
    note: '在咖啡廳',
    roleConfig: defaultRoleConfig(7),
    roleAssignment: { p1: 'merlin', p4: 'assassin' },
    lady: { initialHolderId: 'p7' },
  })
  for (const fails of [0, 1]) {
    g = gameReducer(g, {
      type: 'propose',
      team: ids.slice(0, g.rounds.length ? 3 : 2),
      votes: votesFromApprovals(ids, ids),
      inputMode: 'anomalies',
    })
    g = gameReducer(g, { type: 'recordQuest', failCount: fails })
  }
  g = gameReducer(g, { type: 'useLady', targetId: 'p3', declared: 'good' })
  return { ...g, savedAt: '2026-11-01T13:00:00.000Z' }
}

function buildLiveGame(): Game {
  let g = createGame({
    id: 'g-live',
    now: '2026-11-18T20:00:00.000Z',
    players: makePlayers(['A', 'B', 'C', 'D', 'E']),
  })
  g = gameReducer(g, {
    type: 'propose',
    team: ['p1', 'p2'],
    votes: uniformVotes(ids.slice(0, 5), 'reject'),
    inputMode: 'approvals',
  })
  return g
}

// Built once: the reducer stamps updatedAt with the current time.
const FINISHED = buildFinishedGame()
const LIVE = buildLiveGame()
const finishedGame = () => FINISHED
const liveGame = () => LIVE

let n = 0
let target: AvalonDB

async function seedV1() {
  localStorage.setItem(LEGACY.settings, JSON.stringify(V1_SETTINGS))
  localStorage.setItem(LEGACY.session, JSON.stringify(V1_SESSION))
  localStorage.setItem(`${LEGACY.uiPrefix}proposal-draft`, JSON.stringify(V1_DRAFT))
  const old = new AvalonDB(LEGACY.database)
  await old.games.bulkPut([toRecord(finishedGame()), toRecord(liveGame())])
  old.close()
}

beforeEach(async () => {
  target = new AvalonDB(`avalon-record-test-${n++}`)
  await seedV1()
})
afterEach(async () => {
  await target.delete()
  await new AvalonDB(LEGACY.database).delete()
  reloadGlobalTheme()
})

describe('migrating from 1.9.1', () => {
  it('moves settings, theme, session, drafts and games intact', async () => {
    expect(await migrateFromV1(target)).toEqual({ status: 'migrated', games: 2, skipped: 0 })

    expect(readStore(THEME_STORE)).toEqual({ mode: 'dark', accent: 'teal' })
    const { theme: _theme, ...rest } = V1_SETTINGS.data
    expect(readSettings()).toEqual({ ...DEFAULT_SETTINGS, ...rest })
    expect(JSON.parse(localStorage.getItem('avalon:record:session')!)).toEqual(V1_SESSION)
    expect(JSON.parse(localStorage.getItem('avalon:record:ui:proposal-draft')!)).toEqual(V1_DRAFT)

    const games = (await target.games.toArray())
      .map((r) => r.game)
      .toSorted((a, b) => a.id.localeCompare(b.id))
    expect(games).toEqual([finishedGame(), liveGame()].toSorted((a, b) => a.id.localeCompare(b.id)))

    expect(localStorage.getItem(MIGRATED_FLAG)).toBe('1.9.1')
    expect(localStorage.getItem(CLEANUP_FLAG)).toBe('2.1.0')
    // the 1.x data is kept for a release cycle
    expect(localStorage.getItem(LEGACY.settings)).not.toBeNull()
    expect(await new AvalonDB(LEGACY.database).games.count()).toBe(2)
  })

  it('maps the 1.x forcedAutoReject switch', async () => {
    localStorage.setItem(
      LEGACY.settings,
      JSON.stringify({
        version: 1,
        data: { theme: { flavor: 'latte', accent: 'blue' }, forcedAutoReject: false },
      }),
    )
    await migrateFromV1(target)
    expect(readSettings().forcedAutoApprove).toBe(false)
    expect(readStore(THEME_STORE)).toEqual({ mode: 'light', accent: 'blue' })
  })

  it('is safe to run again', async () => {
    await migrateFromV1(target)
    const before = { ...localStorage }
    expect(await migrateFromV1(target)).toEqual({ status: 'already' })
    expect({ ...localStorage }).toEqual(before)
    // even without the flag, a re-run adds nothing and overwrites nothing
    localStorage.removeItem(MIGRATED_FLAG)
    localStorage.setItem('avalon:record:viewMode', JSON.stringify({ version: 1, data: 'full' }))
    const edited = { ...finishedGame(), note: '升級後修改' }
    await target.games.put(toRecord(edited))
    expect(await migrateFromV1(target)).toMatchObject({ status: 'migrated', games: 2 })
    expect(await target.games.count()).toBe(2)
    expect((await target.games.get(edited.id))!.game.note).toBe('升級後修改')
    expect(readSettings().viewMode).toBe('full')
  })

  it('does nothing for a fresh 2.x install', async () => {
    localStorage.clear()
    await new AvalonDB(LEGACY.database).delete()
    expect(await migrateFromV1(target)).toEqual({ status: 'none' })
    expect(localStorage.getItem(MIGRATED_FLAG)).toBeNull()
  })

  it('keeps everything and reports the error when copying fails; the backup is importable', async () => {
    vi.spyOn(target.games, 'bulkPut').mockRejectedValue(new Error('quota exceeded'))
    const result = await migrateFromV1(target)
    expect(result).toEqual({ status: 'failed', error: 'quota exceeded' })
    expect(localStorage.getItem(MIGRATED_FLAG)).toBeNull()
    expect(localStorage.getItem(LEGACY.settings)).not.toBeNull()
    expect(await new AvalonDB(LEGACY.database).games.count()).toBe(2)

    const backup = parseGamesJson(await exportLegacyBackup())
    expect(backup.errors).toEqual([])
    expect(backup.games.map((g) => g.id).toSorted()).toEqual(
      [finishedGame().id, 'g-live'].toSorted(),
    )
  })
})
