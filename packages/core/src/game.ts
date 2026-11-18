import {
  failsRequired,
  isForcedAttempt,
  isMajority,
  isPlayerCount,
  QUEST_COUNT,
  questSucceeded,
  teamSize,
  WINNING_QUESTS,
  countApprovals,
} from './rules.ts'
import type {
  Assassination,
  Faction,
  Game,
  InputMode,
  Player,
  PlayerId,
  Proposal,
  RoleAssignment,
  RoleConfig,
  Round,
  Votes,
} from './types.ts'
import { SCHEMA_VERSION } from './types.ts'
import { currentLadyHolder, isLadyQuest, ladyTargetOptions } from './lady.ts'
import type { LadyDeclaration, LadyUse } from './types.ts'

export class GameRuleError extends Error {
  override name = 'GameRuleError'
}

export type Phase = 'proposal' | 'quest' | 'lady' | 'assassination' | 'finished'
export type QuestOutcome = 'success' | 'fail'
export type WinReason =
  | 'quests-failed'
  | 'forced-rejected'
  | 'assassination-hit'
  | 'assassination-missed'

export interface GameState {
  phase: Phase
  /** 0-based index of the current (or last, when finished) quest. */
  questIndex: number
  /** 1-based attempt number of the proposal being recorded (phase `proposal`), else of the approved one. */
  attempt: number
  leaderId: PlayerId
  teamSize: number
  failsRequired: number
  /** The proposal being recorded is the 5th (last) one: if it fails, evil wins. */
  forced: boolean
  outcomes: (QuestOutcome | null)[]
  successes: number
  fails: number
  winner: Faction | null
  winReason: WinReason | null
  /** Current Lady of the Lake holder, or null when not in play. */
  ladyHolderId: PlayerId | null
}

export function makePlayers(names: readonly string[]): Player[] {
  return names.map((name, i) => ({ id: `p${i + 1}`, name: name.trim() || `${i + 1}號` }))
}

export function defaultPlayerNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${i + 1}號`)
}

export interface CreateGameInput {
  id: string
  now: string
  players: Player[]
  firstLeaderId?: PlayerId
  name?: { custom?: string | null; auto?: string; seq?: number }
  note?: string
  roleConfig?: RoleConfig | null
  roleAssignment?: RoleAssignment
  /** Enables Lady of the Lake with this initial holder. */
  lady?: { initialHolderId: PlayerId } | null
}

export function createGame(input: CreateGameInput): Game {
  const { players } = input
  if (!isPlayerCount(players.length)) throw new GameRuleError(`人數必須為 5–10 人`)
  if (new Set(players.map((p) => p.id)).size !== players.length) {
    throw new GameRuleError('玩家 ID 重複')
  }
  const firstLeaderId = input.firstLeaderId ?? players[0]!.id
  if (!players.some((p) => p.id === firstLeaderId)) throw new GameRuleError('第一位隊長不在玩家中')
  const custom = input.name?.custom?.trim()
  return {
    schemaVersion: SCHEMA_VERSION,
    id: input.id,
    createdAt: input.now,
    updatedAt: input.now,
    savedAt: null,
    name: {
      custom: custom ? custom : null,
      auto: input.name?.auto ?? '',
      seq: input.name?.seq ?? 1,
    },
    note: input.note ?? '',
    players,
    firstLeaderId,
    roleConfig: input.roleConfig ?? null,
    roleAssignment: input.roleAssignment ?? {},
    rounds: [],
    assassination: null,
    lady: input.lady ? { initialHolderId: input.lady.initialHolderId, uses: [] } : null,
  }
}

export function playerIds(game: Pick<Game, 'players'>): PlayerId[] {
  return game.players.map((p) => p.id)
}

export function playerName(game: Pick<Game, 'players'>, id: PlayerId): string {
  return game.players.find((p) => p.id === id)?.name ?? id
}

export function nextSeat(game: Pick<Game, 'players'>, id: PlayerId, step = 1): PlayerId {
  const n = game.players.length
  const i = game.players.findIndex((p) => p.id === id)
  if (i < 0) throw new GameRuleError(`找不到玩家 ${id}`)
  return game.players[(((i + step) % n) + n) % n]!.id
}

export function allProposals(game: Pick<Game, 'rounds'>): Proposal[] {
  return game.rounds.flatMap((r) => r.proposals)
}

export function isProposalApproved(game: Pick<Game, 'players'>, proposal: Proposal): boolean {
  return isMajority(countApprovals(proposal.votes), game.players.length)
}

export function questOutcome(
  game: Pick<Game, 'players'>,
  questIndex: number,
  round: Round,
): QuestOutcome | null {
  if (!round.result) return null
  return questSucceeded(game.players.length, questIndex, round.result.failCount)
    ? 'success'
    : 'fail'
}

/** Whether the assassin hit Merlin; uses the role assignment when Merlin is known. */
export function assassinationHit(
  game: Pick<Game, 'roleAssignment'>,
  assassination: Assassination | null,
): boolean | null {
  if (!assassination) return null
  const merlin = Object.entries(game.roleAssignment).find(([, r]) => r === 'merlin')?.[0]
  if (merlin && assassination.targetId) return assassination.targetId === merlin
  return assassination.manualHit
}

/** Derives the full game progress from the recorded data. Pure. */
export function deriveState(game: Game): GameState {
  const n = game.players.length
  const outcomes: (QuestOutcome | null)[] = Array.from({ length: QUEST_COUNT }, (_, i) => {
    const round = game.rounds[i]
    return round ? questOutcome(game, i, round) : null
  })
  const successes = outcomes.filter((o) => o === 'success').length
  const fails = outcomes.filter((o) => o === 'fail').length

  const proposals = allProposals(game)
  const lastProposal = proposals.at(-1)
  const nextLeader = lastProposal ? nextSeat(game, lastProposal.leaderId) : game.firstLeaderId

  const lastIndex = Math.max(0, game.rounds.length - 1)
  const lastRound = game.rounds[lastIndex]

  const base = {
    outcomes,
    successes,
    fails,
    winner: null,
    winReason: null,
    ladyHolderId: currentLadyHolder(game),
  } as const

  if (fails >= WINNING_QUESTS) {
    return {
      ...base,
      phase: 'finished',
      questIndex: lastIndex,
      attempt: lastRound?.proposals.length ?? 1,
      leaderId: lastProposal?.leaderId ?? game.firstLeaderId,
      teamSize: teamSize(n, lastIndex),
      failsRequired: failsRequired(n, lastIndex),
      forced: false,
      winner: 'evil',
      winReason: 'quests-failed',
    }
  }

  // The 5th proposal of a quest was voted down: evil wins immediately.
  const lastOfRound = lastRound?.proposals.at(-1)
  if (
    lastRound &&
    !lastRound.result &&
    lastOfRound?.forced &&
    !isProposalApproved(game, lastOfRound)
  ) {
    return {
      ...base,
      phase: 'finished',
      questIndex: lastIndex,
      attempt: lastRound.proposals.length,
      leaderId: lastOfRound.leaderId,
      teamSize: teamSize(n, lastIndex),
      failsRequired: failsRequired(n, lastIndex),
      forced: false,
      winner: 'evil',
      winReason: 'forced-rejected',
    }
  }

  if (successes >= WINNING_QUESTS) {
    const hit = assassinationHit(game, game.assassination)
    const finished = game.assassination !== null && hit !== null
    return {
      ...base,
      phase: finished ? 'finished' : 'assassination',
      questIndex: lastIndex,
      attempt: lastRound?.proposals.length ?? 1,
      leaderId: lastProposal?.leaderId ?? game.firstLeaderId,
      teamSize: teamSize(n, lastIndex),
      failsRequired: failsRequired(n, lastIndex),
      forced: false,
      winner: finished ? (hit ? 'evil' : 'good') : null,
      winReason: finished ? (hit ? 'assassination-hit' : 'assassination-missed') : null,
    }
  }

  // Awaiting a quest result?
  if (lastRound && !lastRound.result) {
    const last = lastRound.proposals.at(-1)
    if (last && isProposalApproved(game, last)) {
      return {
        ...base,
        phase: 'quest',
        questIndex: lastIndex,
        attempt: lastRound.proposals.length,
        leaderId: last.leaderId,
        teamSize: teamSize(n, lastIndex),
        failsRequired: failsRequired(n, lastIndex),
        forced: last.forced,
      }
    }
  }

  // Lady of the Lake after quests 2–4, before the next quest's proposals.
  if (lastRound?.result && game.lady && isLadyQuest(lastIndex)) {
    const used = game.lady.uses.some((u) => u.afterQuest === lastIndex)
    if (!used) {
      return {
        ...base,
        phase: 'lady',
        questIndex: lastIndex,
        attempt: lastRound.proposals.length,
        leaderId: nextLeader,
        teamSize: teamSize(n, lastIndex),
        failsRequired: failsRequired(n, lastIndex),
        forced: false,
      }
    }
  }

  const questIndex = !lastRound ? 0 : lastRound.result ? lastIndex + 1 : lastIndex
  const attempt = !lastRound || lastRound.result ? 1 : lastRound.proposals.length + 1
  return {
    ...base,
    phase: 'proposal',
    questIndex,
    attempt,
    leaderId: nextLeader,
    teamSize: teamSize(n, questIndex),
    failsRequired: failsRequired(n, questIndex),
    forced: isForcedAttempt(attempt),
  }
}

export function isFinished(game: Game): boolean {
  return deriveState(game).phase === 'finished'
}

// ---------------------------------------------------------------------------
// Actions

export type GameAction =
  | {
      type: 'propose'
      team: PlayerId[]
      votes: Votes
      inputMode: InputMode
      /** Overrides the derived leader (e.g. to correct a mistake). */
      leaderId?: PlayerId
    }
  | { type: 'recordQuest'; failCount: number }
  | { type: 'assassinate'; targetId: PlayerId | null; manualHit: boolean | null }
  | { type: 'undo' }
  | { type: 'rename'; custom: string | null }
  | { type: 'setNote'; note: string }
  | { type: 'setRoleConfig'; roleConfig: RoleConfig | null }
  | { type: 'setRoleAssignment'; roleAssignment: RoleAssignment }
  | { type: 'setAutoName'; auto: string }
  | { type: 'markSaved' }
  | { type: 'useLady'; targetId: PlayerId; declared: LadyDeclaration; note?: string }

export function validateTeam(
  game: Game,
  team: readonly PlayerId[],
  questIndex: number,
): string | null {
  const ids = new Set(playerIds(game))
  if (new Set(team).size !== team.length) return '隊員重複'
  if (team.some((id) => !ids.has(id))) return '隊員不在玩家名單中'
  const size = teamSize(game.players.length, questIndex)
  if (team.length !== size) return `需要選 ${size} 位隊員（目前 ${team.length} 位）`
  return null
}

export function validateVotes(game: Game, votes: Votes): string | null {
  for (const p of game.players) {
    const v = votes[p.id]
    if (v !== 'approve' && v !== 'reject') return `缺少 ${p.name} 的投票`
  }
  return null
}

function updateRound(game: Game, questIndex: number, fn: (r: Round) => Round): Game {
  const round = game.rounds[questIndex]
  if (!round) throw new GameRuleError(`第 ${questIndex + 1} 個任務尚未開始`)
  return { ...game, rounds: game.rounds.map((r, i) => (i === questIndex ? fn(r) : r)) }
}

function apply(game: Game, action: GameAction): Game {
  switch (action.type) {
    case 'propose': {
      const s = deriveState(game)
      if (s.phase !== 'proposal') throw new GameRuleError('目前不是派票階段')
      const teamError = validateTeam(game, action.team, s.questIndex)
      if (teamError) throw new GameRuleError(teamError)
      const voteError = validateVotes(game, action.votes)
      if (voteError) throw new GameRuleError(voteError)
      const leaderId = action.leaderId ?? s.leaderId
      if (!game.players.some((p) => p.id === leaderId))
        throw new GameRuleError('隊長不在玩家名單中')
      const order = playerIds(game)
      const proposal: Proposal = {
        id: `q${s.questIndex + 1}-p${s.attempt}`,
        leaderId,
        team: order.filter((id) => action.team.includes(id)),
        votes: Object.fromEntries(order.map((id) => [id, action.votes[id]!])),
        inputMode: action.inputMode,
        forced: s.forced,
      }
      const rounds =
        s.attempt === 1
          ? [...game.rounds, { proposals: [proposal], result: null }]
          : game.rounds.map((r, i) =>
              i === s.questIndex ? { ...r, proposals: [...r.proposals, proposal] } : r,
            )
      return { ...game, rounds }
    }
    case 'recordQuest': {
      const s = deriveState(game)
      if (s.phase !== 'quest') throw new GameRuleError('目前不是任務執行階段')
      const size = s.teamSize
      if (!Number.isInteger(action.failCount) || action.failCount < 0 || action.failCount > size) {
        throw new GameRuleError(`失敗票數必須介於 0 到 ${size}`)
      }
      return updateRound(game, s.questIndex, (r) => ({
        ...r,
        result: { failCount: action.failCount },
      }))
    }
    case 'assassinate': {
      const s = deriveState(game)
      if (s.phase !== 'assassination' && !(s.phase === 'finished' && game.assassination)) {
        throw new GameRuleError('目前不是刺殺階段')
      }
      if (action.targetId && !game.players.some((p) => p.id === action.targetId)) {
        throw new GameRuleError('刺殺目標不在玩家名單中')
      }
      return { ...game, assassination: { targetId: action.targetId, manualHit: action.manualHit } }
    }
    case 'undo':
      return undoLast(game)
    case 'rename': {
      const custom = action.custom?.trim()
      return { ...game, name: { ...game.name, custom: custom ? custom : null } }
    }
    case 'setNote':
      return { ...game, note: action.note }
    case 'setRoleConfig':
      return { ...game, roleConfig: action.roleConfig }
    case 'setRoleAssignment':
      return { ...game, roleAssignment: pruneAssignment(game, action.roleAssignment) }
    case 'setAutoName':
      return { ...game, name: { ...game.name, auto: action.auto } }
    case 'useLady': {
      const s = deriveState(game)
      if (s.phase !== 'lady' || !game.lady) throw new GameRuleError('目前不是湖中女神階段')
      const holderId = s.ladyHolderId!
      if (!game.players.some((p) => p.id === action.targetId)) {
        throw new GameRuleError('查驗對象不在玩家名單中')
      }
      const option = ladyTargetOptionsFor(game, holderId).find(
        (o) => o.playerId === action.targetId,
      )
      if (option?.disabledReason) throw new GameRuleError(option.disabledReason)
      const use: LadyUse = {
        afterQuest: s.questIndex,
        holderId,
        targetId: action.targetId,
        declared: action.declared,
        note: action.note?.trim() ?? '',
      }
      return { ...game, lady: { ...game.lady, uses: [...game.lady.uses, use] } }
    }
    case 'markSaved':
      return game
  }
}

function pruneAssignment(game: Game, assignment: RoleAssignment): RoleAssignment {
  const ids = new Set(playerIds(game))
  return Object.fromEntries(
    Object.entries(assignment).filter(([id, role]) => ids.has(id) && role !== undefined),
  )
}

/** Applies an action, returning a new game. Throws `GameRuleError` on invalid input. */
export function gameReducer(
  game: Game,
  action: GameAction,
  now: string = new Date().toISOString(),
): Game {
  const next = apply(game, action)
  if (next === game && action.type !== 'markSaved') return game
  return { ...next, updatedAt: now, ...(action.type === 'markSaved' ? { savedAt: now } : {}) }
}

export type LastStep =
  | { kind: 'assassination' }
  | { kind: 'lady'; questIndex: number }
  | { kind: 'quest'; questIndex: number }
  | { kind: 'proposal'; questIndex: number; attempt: number }

/** What `undoLast` would remove, or null for a fresh game. */
export function lastStep(game: Game): LastStep | null {
  if (game.assassination) return { kind: 'assassination' }
  const last = game.rounds.at(-1)
  if (!last) return null
  const q = game.rounds.length - 1
  if (last.result && game.lady?.uses.some((u) => u.afterQuest === q))
    return { kind: 'lady', questIndex: q }
  if (last.result) return { kind: 'quest', questIndex: q }
  return { kind: 'proposal', questIndex: q, attempt: last.proposals.length }
}

/** Removes the most recently recorded step (assassination → quest result → proposal). */
export function undoLast(game: Game): Game {
  if (game.assassination) return { ...game, assassination: null }
  const last = game.rounds.at(-1)
  if (!last) return game
  const lastIndex = game.rounds.length - 1
  if (last.result && game.lady?.uses.some((u) => u.afterQuest === lastIndex)) {
    return {
      ...game,
      lady: { ...game.lady, uses: game.lady.uses.filter((u) => u.afterQuest !== lastIndex) },
    }
  }
  if (last.result)
    return { ...game, rounds: [...game.rounds.slice(0, -1), { ...last, result: null }] }
  const proposals = last.proposals.slice(0, -1)
  return {
    ...game,
    rounds: proposals.length
      ? [...game.rounds.slice(0, -1), { ...last, proposals }]
      : game.rounds.slice(0, -1),
  }
}

export function canUndo(game: Game): boolean {
  return game.assassination !== null || game.rounds.length > 0
}

function ladyTargetOptionsFor(game: Game, holderId: PlayerId) {
  return ladyTargetOptions(game, game.lady?.uses.length ?? 0, holderId)
}
