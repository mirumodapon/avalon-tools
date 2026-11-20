import { defaultPlayerNames, makePlayers } from '@avalon/record-core'
import { describe, expect, it } from 'vitest'
import { votingOrder } from './votingOrder.ts'

describe('votingOrder', () => {
  it('starts with the leader and goes clockwise', () => {
    const game = { players: makePlayers(defaultPlayerNames(7)) }
    expect(votingOrder(game, 'p6')).toEqual(['p6', 'p7', 'p1', 'p2', 'p3', 'p4', 'p5'])
    expect(votingOrder(game, 'p1')).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'])
  })
})
