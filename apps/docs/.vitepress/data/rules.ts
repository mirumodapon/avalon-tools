/**
 * Table data for the rules pages, computed from @avalon/rules so the docs follow any
 * change to the rules package (rebuild the docs to pick it up).
 */
import {
  defaultRoleConfig,
  factionCounts,
  failsRequired,
  FACTION_LABEL,
  PLAYER_COUNTS,
  QUEST_COUNT,
  ROLE_IDS,
  ROLES,
  roleDef,
  teamSizes,
  visionFor,
  type Faction,
  type RoleId,
  type SeatRole,
  type Vision,
} from '@avalon/rules'

export interface QuestCell {
  size: number
  /** Fail cards needed to fail this quest (2 marks the special 4th quest). */
  fails: number
}

export interface PlayerCountRow {
  players: number
  good: number
  evil: number
  quests: QuestCell[]
}

export function playerCountRows(): PlayerCountRow[] {
  return PLAYER_COUNTS.map((players) => {
    const sizes = teamSizes(players)
    return {
      players,
      ...factionCounts(players),
      quests: Array.from({ length: QUEST_COUNT }, (_, i) => ({
        size: sizes[i]!,
        fails: failsRequired(players, i),
      })),
    }
  })
}

/** What each role can do. The rules package has no prose, so this is written by hand. */
export const ROLE_ABILITY: Record<RoleId, string> = {
  merlin: '夜晚知道壞人是誰（莫德雷德除外）。壞人刺殺成功時好人落敗，所以要小心不被認出。',
  percival: '夜晚看到梅林與莫甘娜，但分不出誰是誰。',
  loyal: '沒有特殊能力。',
  morgana: '在派西維爾眼中和梅林一模一樣，用來混淆派西維爾。',
  assassin: '好人完成三次任務後，刺殺一名玩家；刺中梅林則壞人獲勝。',
  mordred: '梅林看不到他。',
  oberon: '不認識其他壞人，其他壞人也不認識他；梅林看得到他。',
  minion: '沒有特殊能力，夜晚和其他壞人互相認識。',
}

const VISION_LABEL: Record<Vision['kind'], string> = {
  evil: '壞人',
  merlinOrMorgana: '梅林與莫甘娜（分不出誰是誰）',
  teammates: '其他壞人',
  isolated: '不認識任何人',
  none: '沒有額外資訊',
}

/** One seat per role, so every role's vision can be read off a single table. */
const DEMO_TABLE: SeatRole[] = ROLE_IDS.map((role, i) => ({ seat: i + 1, role }))

function roleAt(seat: number): RoleId {
  return DEMO_TABLE.find((p) => p.seat === seat)!.role
}

export interface RoleRow {
  id: RoleId
  name: string
  nameEn: string
  faction: Faction
  factionLabel: string
  unique: boolean
  ability: string
  /** The kind of information the role gets at night. */
  sees: string
  /** The roles it sees, by name (empty when it sees no one). */
  seesRoles: string[]
  /** The roles that see it, by name. */
  seenBy: string[]
}

export function roleRows(): RoleRow[] {
  const visions = new Map(DEMO_TABLE.map((p) => [p.role, visionFor(p, DEMO_TABLE)]))
  const seats = (v: Vision) => ('seats' in v ? v.seats : [])
  return ROLES.map((r) => {
    const vision = visions.get(r.id)!
    const self = DEMO_TABLE.find((p) => p.role === r.id)!.seat
    return {
      id: r.id,
      name: r.name,
      nameEn: r.nameEn,
      faction: r.faction,
      factionLabel: FACTION_LABEL[r.faction],
      unique: r.unique,
      ability: ROLE_ABILITY[r.id],
      sees: VISION_LABEL[vision.kind],
      seesRoles: seats(vision).map((s) => roleDef(roleAt(s)).name),
      seenBy: [...visions]
        .filter(([, v]) => seats(v).includes(self))
        .map(([role]) => roleDef(role).name),
    }
  })
}

export interface DefaultConfigRow {
  players: number
  roles: { name: string; faction: Faction; count: number }[]
}

/** The role setup the game record suggests for each player count. */
export function defaultConfigRows(): DefaultConfigRow[] {
  return PLAYER_COUNTS.map((players) => {
    const config = defaultRoleConfig(players)
    return {
      players,
      roles: ROLES.filter((r) => (config[r.id] ?? 0) > 0).map((r) => ({
        name: r.name,
        faction: r.faction,
        count: config[r.id]!,
      })),
    }
  })
}
