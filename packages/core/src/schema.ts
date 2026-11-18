/**
 * Runtime schema for persisted/imported games, plus a migration pipeline keyed on
 * `schemaVersion`. Add a step to `MIGRATIONS` whenever `SCHEMA_VERSION` is bumped.
 */
import { z } from 'zod'
import { isPlayerCount } from './rules.ts'
import { ROLE_IDS } from './roles.ts'
import { SCHEMA_VERSION, type Game, type RoleId } from './types.ts'

const id = z.string().min(1)
const vote = z.enum(['approve', 'reject'])
const roleId = z.enum(ROLE_IDS as [RoleId, ...RoleId[]])
const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), '不是有效的日期時間')

const proposalSchema = z.object({
  id,
  leaderId: id,
  team: z.array(id),
  votes: z.record(z.string(), vote),
  inputMode: z.enum(['approvals', 'anomalies']),
  forced: z.boolean(),
})

const roundSchema = z.object({
  proposals: z.array(proposalSchema).min(1).max(5),
  result: z.object({ failCount: z.number().int().min(0) }).nullable(),
})

const ladyUseSchema = z.object({
  afterQuest: z.number().int().min(0).max(4),
  holderId: id,
  targetId: id.nullable(),
  declared: z.enum(['good', 'evil', 'none']),
  skipped: z.boolean(),
  note: z.string(),
})

export const gameSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    id,
    createdAt: isoDate,
    updatedAt: isoDate,
    savedAt: isoDate.nullable(),
    name: z.object({
      custom: z.string().nullable(),
      auto: z.string(),
      seq: z.number().int().min(1),
    }),
    note: z.string(),
    players: z.array(z.object({ id, name: z.string() })),
    firstLeaderId: id,
    roleConfig: z.partialRecord(roleId, z.number().int().min(0)).nullable(),
    roleAssignment: z.partialRecord(z.string(), roleId),
    rounds: z.array(roundSchema).max(5),
    assassination: z
      .object({ targetId: id.nullable(), manualHit: z.boolean().nullable() })
      .nullable(),
    lady: z.object({ initialHolderId: id, uses: z.array(ladyUseSchema).max(3) }).nullable(),
  })
  .superRefine((g, ctx) => {
    const ids = new Set(g.players.map((p) => p.id))
    const issue = (message: string, path: (string | number)[]) =>
      ctx.addIssue({ code: 'custom', message, path })
    if (!isPlayerCount(g.players.length))
      issue(`人數必須為 5–10 人（目前 ${g.players.length}）`, ['players'])
    if (ids.size !== g.players.length) issue('玩家 ID 重複', ['players'])
    if (!ids.has(g.firstLeaderId)) issue('第一位隊長不在玩家中', ['firstLeaderId'])
    for (const pid of Object.keys(g.roleAssignment)) {
      if (!ids.has(pid)) issue(`角色指派的玩家 ${pid} 不存在`, ['roleAssignment', pid])
    }
    g.rounds.forEach((r, ri) =>
      r.proposals.forEach((p, pi) => {
        const path = ['rounds', ri, 'proposals', pi]
        if (!ids.has(p.leaderId)) issue('隊長不在玩家中', [...path, 'leaderId'])
        if (p.team.some((t) => !ids.has(t))) issue('隊員不在玩家中', [...path, 'team'])
        for (const pl of ids)
          if (!(pl in p.votes)) issue(`缺少玩家 ${pl} 的投票`, [...path, 'votes'])
      }),
    )
    if (g.assassination?.targetId && !ids.has(g.assassination.targetId)) {
      issue('刺殺目標不在玩家中', ['assassination'])
    }
    if (g.lady && !ids.has(g.lady.initialHolderId)) issue('湖中女神初始持有者不在玩家中', ['lady'])
  })

/** `MIGRATIONS[n]` upgrades a raw game object from schema version n to n + 1. */
export const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> =
  {}

export class GameSchemaError extends Error {
  override name = 'GameSchemaError'
}

export function migrateGame(
  raw: unknown,
  migrations: typeof MIGRATIONS = MIGRATIONS,
  target: number = SCHEMA_VERSION,
): unknown {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new GameSchemaError('遊戲資料必須是物件')
  }
  let obj = raw as Record<string, unknown>
  let version = obj.schemaVersion
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new GameSchemaError('缺少有效的 schemaVersion')
  }
  if (version > target) {
    throw new GameSchemaError(`資料版本 ${version} 比此版本程式 (${target}) 更新，請先更新程式`)
  }
  while (version < target) {
    const step = migrations[version]
    if (!step) throw new GameSchemaError(`缺少版本 ${version} → ${version + 1} 的 migration`)
    obj = { ...step(obj), schemaVersion: version + 1 }
    version += 1
  }
  return obj
}

export type ParseResult = { ok: true; game: Game } | { ok: false; error: string }

function formatIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 5)
    .map((i) => (i.path.length ? `${i.path.join('.')}：${i.message}` : i.message))
    .join('\n')
}

/** Migrates and validates an unknown value into a Game. */
export function parseGame(raw: unknown): ParseResult {
  let migrated: unknown
  try {
    migrated = migrateGame(raw)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
  const r = gameSchema.safeParse(migrated)
  return r.success
    ? { ok: true, game: r.data as Game }
    : { ok: false, error: formatIssues(r.error) }
}
