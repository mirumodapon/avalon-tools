/**
 * Compact share format: a game packed into small arrays (indexes and bitmasks
 * instead of ids and objects) so it fits in a URL. Pure and synchronous;
 * compression and base64 live in the web app.
 *
 * Layout (version 1):
 *   [1, id, createdAtSeconds, names[], firstLeader, custom|0, seq, note|0, saved(0/1),
 *    roleConfig|0, assignment, rounds, assassination|0, lady|0]
 * - roleConfig: counts in ROLE_IDS order
 * - assignment: one char per seat, '-' = unknown, else index into ROLE_IDS
 * - round: [failCount (-1 = none), ...proposals]
 * - proposal: one integer = mode | votes << 1 | team << 11 | leader << 21
 * - assassination: [target (-1 = none), manualHit (-1/0/1)]
 * - lady: [initialHolder, ...uses] with use = target * 3 + declared, or [code, note]
 */
import { ROLE_IDS } from '@avalon/rules'
import { parseGame } from './schema.ts'
import type { Game, LadyDeclaration, Proposal, RoleConfig, RoleId, Votes } from './types.ts'
import { SCHEMA_VERSION } from './types.ts'

export const SHARE_VERSION = 1
const DECLARATIONS: LadyDeclaration[] = ['good', 'evil', 'none']

type Packed = unknown[]

function mask(ids: readonly string[], order: readonly string[]): number {
  return order.reduce((m, id, i) => (ids.includes(id) ? m | (1 << i) : m), 0)
}

function fromMask(m: number, order: readonly string[]): string[] {
  return order.filter((_, i) => m & (1 << i))
}

/** Shortens a UUID to 22 base64url chars; other ids are kept as-is (prefixed with '~'). */
function packId(id: string): string {
  const hex = id.replace(/-/g, '')
  if (!/^[0-9a-f]{32}$/i.test(hex)) return `~${id}`
  let bin = ''
  for (let i = 0; i < 32; i += 2)
    bin += String.fromCharCode(Number.parseInt(hex.slice(i, i + 2), 16))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function unpackId(s: string): string {
  if (s.startsWith('~')) return s.slice(1)
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  const hex = [...bin].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function packGame(game: Game): Packed {
  const order = game.players.map((p) => p.id)
  const seat = (id: string) => order.indexOf(id)
  const packProposal = (p: Proposal) => {
    const approvers = order.filter((id) => p.votes[id] === 'approve')
    return (
      (p.inputMode === 'anomalies' ? 1 : 0) +
      mask(approvers, order) * 2 +
      mask(p.team, order) * 2 ** 11 +
      seat(p.leaderId) * 2 ** 21
    )
  }
  const roleConfig = game.roleConfig ? ROLE_IDS.map((r) => game.roleConfig![r] ?? 0) : 0
  const assignment = order.map((id) => {
    const r = game.roleAssignment[id]
    return r ? String(ROLE_IDS.indexOf(r)) : '-'
  })
  const lady = game.lady
    ? [
        seat(game.lady.initialHolderId),
        ...game.lady.uses.map((u) => {
          const code = seat(u.targetId) * 3 + DECLARATIONS.indexOf(u.declared)
          return u.note ? [code, u.note] : code
        }),
      ]
    : 0
  return [
    SHARE_VERSION,
    packId(game.id),
    Math.round(Date.parse(game.createdAt) / 1000),
    game.players.map((p) => p.name),
    seat(game.firstLeaderId),
    game.name.custom ?? 0,
    game.name.seq,
    game.note || 0,
    game.savedAt ? 1 : 0,
    roleConfig,
    assignment.join(''),
    game.rounds.map((r) => [r.result ? r.result.failCount : -1, ...r.proposals.map(packProposal)]),
    game.assassination
      ? [
          game.assassination.targetId ? seat(game.assassination.targetId) : -1,
          game.assassination.manualHit === null ? -1 : game.assassination.manualHit ? 1 : 0,
        ]
      : 0,
    lady,
  ]
}

export class ShareFormatError extends Error {
  override name = 'ShareFormatError'
}

/** Rebuilds a game from the packed form and validates it like any import. */
export function unpackGame(packed: unknown, now: string = new Date().toISOString()): Game {
  if (!Array.isArray(packed) || packed[0] !== SHARE_VERSION) {
    throw new ShareFormatError('分享連結格式不支援或已損毀')
  }
  try {
    const [
      ,
      id,
      createdSec,
      names,
      first,
      custom,
      seq,
      note,
      saved,
      roleConfig,
      assignment,
      rounds,
      assassination,
      lady,
    ] = packed as [
      number,
      string,
      number,
      string[],
      number,
      string | 0,
      number,
      string | 0,
      number,
      number[] | 0,
      string,
      number[][],
      [number, number] | 0,
      (number | [number, string])[] | 0,
    ]
    const players = names.map((name, i) => ({ id: `p${i + 1}`, name }))
    const order = players.map((p) => p.id)
    const at = (i: number) => order[i]!
    const createdAt = new Date(createdSec * 1000).toISOString()
    const game: Game = {
      schemaVersion: SCHEMA_VERSION,
      id: unpackId(id),
      createdAt,
      updatedAt: now,
      savedAt: saved ? now : null,
      name: { custom: custom || null, auto: '', seq },
      note: note || '',
      players,
      firstLeaderId: at(first),
      roleConfig: roleConfig
        ? (Object.fromEntries(
            ROLE_IDS.map((r, i) => [r, roleConfig[i] ?? 0]).filter(([, n]) => n),
          ) as RoleConfig)
        : null,
      roleAssignment: Object.fromEntries(
        [...assignment].flatMap((c, i) =>
          c === '-' ? [] : [[at(i), ROLE_IDS[Number(c)] as RoleId]],
        ),
      ),
      rounds: rounds.map(([fail, ...ps], q) => ({
        result: fail! >= 0 ? { failCount: fail! } : null,
        proposals: ps.map((n, a) => {
          const votesMask = Math.floor(n / 2) % 2 ** 10
          const teamMask = Math.floor(n / 2 ** 11) % 2 ** 10
          const leader = Math.floor(n / 2 ** 21)
          const approvers = fromMask(votesMask, order)
          return {
            id: `q${q + 1}-p${a + 1}`,
            leaderId: at(leader),
            team: fromMask(teamMask, order),
            votes: Object.fromEntries(
              order.map((pid) => [pid, approvers.includes(pid) ? 'approve' : 'reject']),
            ) as Votes,
            inputMode: n % 2 ? 'anomalies' : 'approvals',
            forced: a === 4,
          }
        }),
      })),
      assassination: assassination
        ? {
            targetId: assassination[0] >= 0 ? at(assassination[0]) : null,
            manualHit: assassination[1] < 0 ? null : assassination[1] === 1,
          }
        : null,
      lady: null,
    }
    if (lady) {
      const [initial, ...uses] = lady as [number, ...(number | [number, string])[]]
      let holder = at(initial)
      game.lady = {
        initialHolderId: holder,
        uses: uses.map((u, i) => {
          const [code, useNote] = Array.isArray(u) ? u : [u, '']
          const targetId = at(Math.floor(code / 3))
          const use = {
            afterQuest: i + 1,
            holderId: holder,
            targetId,
            declared: DECLARATIONS[code % 3]!,
            note: useNote,
          }
          holder = targetId
          return use
        }),
      }
    }
    const r = parseGame(game)
    if (!r.ok) throw new ShareFormatError(r.error)
    return r.game
  } catch (e) {
    if (e instanceof ShareFormatError) throw e
    throw new ShareFormatError('分享連結格式不支援或已損毀')
  }
}
