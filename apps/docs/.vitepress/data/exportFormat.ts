/**
 * The JSON export format, generated from the game record's zod schema
 * (`gameSchema` in @avalon/record-core), so the docs list exactly what import accepts.
 */
import { gameSchema, SCHEMA_VERSION } from '@avalon/record-core'
import { z } from 'zod'

interface JsonSchema {
  type?: string | string[]
  const?: unknown
  enum?: unknown[]
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  additionalProperties?: JsonSchema | boolean
  propertyNames?: JsonSchema
  anyOf?: JsonSchema[]
  minimum?: number
  maximum?: number
  minItems?: number
  maxItems?: number
  minLength?: number
}

export interface FieldRow {
  /** `rounds[].proposals[].votes.<玩家 id>` style path. */
  path: string
  type: string
  required: boolean
  nullable: boolean
  /** Length or range limits, e.g. `1–5 筆`. */
  limits: string
  description: string
}

/**
 * What each field means. The schema has no descriptions, so these are written by hand;
 * a test fails when a field is added to or removed from the schema without updating this.
 */
export const FIELD_DOC: Record<string, string> = {
  schemaVersion: '資料格式版本，目前為 1。',
  id: '遊戲的唯一 id（UUID）。匯入時用來判斷本機是否已有同一場。',
  createdAt: '建立時間（ISO 8601），也是命名用的開局時間。',
  updatedAt: '最後修改時間（ISO 8601）。',
  savedAt: '在結算頁保存的時間；尚未保存為 null。',
  name: '遊戲名稱。',
  'name.custom': '自訂名稱；有值時優先顯示。',
  'name.auto': '依命名樣板產生的名稱（最後一次保存時）。',
  'name.seq': '當天第幾場，建立時決定。',
  note: '備註。',
  players: '玩家，順序就是座位順序（順時針）。',
  'players[].id': '玩家 id，其他欄位以它指稱玩家。',
  'players[].name': '玩家名稱。',
  firstLeaderId: '第一位隊長的玩家 id。',
  roleConfig: '角色配置（每個角色幾位）；沒有設定為 null。',
  'roleConfig.<角色>': '該角色的數量。',
  roleAssignment: '已知的身分（玩家 id → 角色），可以只填一部分。',
  'roleAssignment.<玩家 id>': '這位玩家的角色。',
  rounds: '每一輪任務，最多 5 輪。',
  'rounds[].proposals': '這輪的派隊紀錄，依序最多 5 次；第 5 次是強制局。',
  'rounds[].proposals[].id': '派隊 id，例如 `q2-p3`（第 2 輪第 3 次）。',
  'rounds[].proposals[].leaderId': '隊長的玩家 id。',
  'rounds[].proposals[].team': '出隊的玩家 id。',
  'rounds[].proposals[].votes': '每位玩家的投票（玩家 id → 贊成或反對）。',
  'rounds[].proposals[].votes.<玩家 id>': '`approve` 贊成、`reject` 反對。',
  'rounds[].proposals[].inputMode':
    '當時的輸入方式：`approvals` 派票（勾選贊成者）、`anomalies` 派跳（勾選與預設不同的人）。',
  'rounds[].proposals[].forced': '是否為強制局（第 5 次派隊）。',
  'rounds[].result': '任務結果；尚未出任務為 null。',
  'rounds[].result.failCount': '失敗票的張數。',
  assassination: '刺殺階段；沒有進行為 null。',
  'assassination.targetId': '被刺殺的玩家 id；尚未選擇為 null。',
  'assassination.manualHit': '沒有指派梅林時，由記錄者判斷是否刺中；其他情況為 null。',
  lady: '湖中女神；沒有使用這個擴充為 null。',
  'lady.initialHolderId': '一開始持有湖中女神的玩家 id。',
  'lady.uses': '每次使用湖中女神，最多 3 次。',
  'lady.uses[].afterQuest': '在第幾次任務之後使用（從 0 起算，1–3 對應第 2–4 次任務後）。',
  'lady.uses[].holderId': '使用者的玩家 id。',
  'lady.uses[].targetId': '被查驗的玩家 id。',
  'lady.uses[].declared': '使用者公開宣稱的結果（可能說謊）：`good`、`evil` 或 `none`（未宣稱）。',
  'lady.uses[].note': '備註。',
}

const ROLE_KEY = '<角色>'
const PLAYER_KEY = '<玩家 id>'

function typeName(s: JsonSchema): string {
  if (s.const !== undefined) return JSON.stringify(s.const)
  if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(' | ')
  const t = Array.isArray(s.type) ? s.type.filter((x) => x !== 'null') : [s.type ?? 'any']
  return t.join(' | ').replace('integer', '整數').replace('number', '數字')
}

function limits(s: JsonSchema): string {
  const max = (n: number | undefined) =>
    n !== undefined && n < Number.MAX_SAFE_INTEGER ? n : undefined
  if (s.type === 'array' && (s.minItems !== undefined || s.maxItems !== undefined)) {
    return `${s.minItems ?? 0}–${s.maxItems ?? '∞'} 筆`
  }
  if (s.minimum !== undefined || max(s.maximum) !== undefined) {
    return `${s.minimum ?? ''}–${max(s.maximum) ?? ''}`.replace(/–$/, ' 以上')
  }
  if (s.minLength) return '不可為空'
  return ''
}

function walk(s: JsonSchema, path: string, required: boolean, out: FieldRow[]): void {
  const variants = s.anyOf ?? [s]
  const nullable =
    variants.some((v) => v.type === 'null') || (Array.isArray(s.type) && s.type.includes('null'))
  const body = variants.find((v) => v.type !== 'null') ?? s
  if (path) {
    const isMap = body.type === 'object' && !body.properties
    out.push({
      path,
      type: isMap
        ? '物件（對照表）'
        : body.type === 'object'
          ? '物件'
          : body.type === 'array'
            ? '陣列'
            : typeName(body),
      required,
      nullable,
      limits: limits(body),
      description: FIELD_DOC[path] ?? '',
    })
  }
  if (body.properties) {
    for (const [key, child] of Object.entries(body.properties)) {
      walk(child, path ? `${path}.${key}` : key, body.required?.includes(key) ?? false, out)
    }
  } else if (body.type === 'object' && typeof body.additionalProperties === 'object') {
    const key = body.propertyNames?.enum ? ROLE_KEY : PLAYER_KEY
    walk(body.additionalProperties, `${path}.${key}`, false, out)
  } else if (body.type === 'array' && body.items) {
    const item = body.items
    if (item.properties) walk({ ...item, anyOf: undefined }, `${path}[]`, true, out)
  }
}

/** Every field of an exported game, in schema order. */
export function exportFields(): FieldRow[] {
  const schema = z.toJSONSchema(gameSchema, { unrepresentable: 'any', io: 'input' }) as JsonSchema
  const out: FieldRow[] = []
  walk(schema, '', true, out)
  // Array items are objects described by their fields; the `[]` rows themselves add nothing.
  return out.filter((r) => !r.path.endsWith('[]'))
}

export { SCHEMA_VERSION }
