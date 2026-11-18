import type { Faction, Votes } from './types.ts'

export const MIN_PLAYERS = 5
export const MAX_PLAYERS = 10
export const PLAYER_COUNTS = [5, 6, 7, 8, 9, 10] as const
export type PlayerCount = (typeof PLAYER_COUNTS)[number]

export const QUEST_COUNT = 5
export const MAX_PROPOSALS = 5
export const WINNING_QUESTS = 3

const TEAM_SIZES: Record<PlayerCount, readonly [number, number, number, number, number]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
}

const FACTION_COUNTS: Record<PlayerCount, Record<Faction, number>> = {
  5: { good: 3, evil: 2 },
  6: { good: 4, evil: 2 },
  7: { good: 4, evil: 3 },
  8: { good: 5, evil: 3 },
  9: { good: 6, evil: 3 },
  10: { good: 6, evil: 4 },
}

export function isPlayerCount(n: number): n is PlayerCount {
  return (PLAYER_COUNTS as readonly number[]).includes(n)
}

function assertPlayerCount(n: number): asserts n is PlayerCount {
  if (!isPlayerCount(n)) throw new RangeError(`不支援的人數：${n}（需為 5–10 人）`)
}

function assertQuest(questIndex: number) {
  if (!Number.isInteger(questIndex) || questIndex < 0 || questIndex >= QUEST_COUNT) {
    throw new RangeError(`任務編號超出範圍：${questIndex}`)
  }
}

/** Required team size for a quest (0-based `questIndex`). */
export function teamSize(playerCount: number, questIndex: number): number {
  assertPlayerCount(playerCount)
  assertQuest(questIndex)
  return TEAM_SIZES[playerCount][questIndex]!
}

export function teamSizes(playerCount: number): readonly number[] {
  assertPlayerCount(playerCount)
  return TEAM_SIZES[playerCount]
}

/** Fail cards needed to fail a quest: 2 on the 4th quest with 7+ players, else 1. */
export function failsRequired(playerCount: number, questIndex: number): number {
  assertPlayerCount(playerCount)
  assertQuest(questIndex)
  return questIndex === 3 && playerCount >= 7 ? 2 : 1
}

export function factionCounts(playerCount: number): Record<Faction, number> {
  assertPlayerCount(playerCount)
  return FACTION_COUNTS[playerCount]
}

export function countApprovals(votes: Votes): number {
  return Object.values(votes).filter((v) => v === 'approve').length
}

/** A proposal passes with strictly more than half approving. */
export function isMajority(approvals: number, playerCount: number): boolean {
  return approvals > playerCount / 2
}

export function questSucceeded(
  playerCount: number,
  questIndex: number,
  failCount: number,
): boolean {
  return failCount < failsRequired(playerCount, questIndex)
}

export function isForcedAttempt(attempt: number): boolean {
  return attempt === MAX_PROPOSALS
}
