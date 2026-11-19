import { FACTION_LABEL, type Faction } from '@avalon/rules'
import { cx } from '@avalon/ui'
import { IconTrophy, IconTrophyOff, IconUserCheck, IconUserX, type Icon } from '@tabler/icons-react'
import { playedCards, type QuestCard } from '../quest/quest.ts'

interface Mark {
  label: string
  icon: Icon
  text: string
  border: string
  /** Tinted background for the choice buttons. */
  tint: string
}

/** How each quest card looks, wherever it is shown: a yellow trophy, or a dark blue one crossed out. */
export const QUEST_CARD: Record<QuestCard, Mark> = {
  success: {
    label: '任務成功',
    icon: IconTrophy,
    text: 'text-quest-success-fg',
    border: 'border-quest-success',
    tint: 'bg-quest-success/15',
  },
  fail: {
    label: '任務失敗',
    icon: IconTrophyOff,
    text: 'text-quest-fail-fg',
    border: 'border-quest-fail',
    tint: 'bg-quest-fail/25',
  },
}

/** How each Lady of the Lake answer looks (same icons as the game record's Lady results). */
export const LADY_MARK: Record<Faction, Mark> = {
  good: {
    label: FACTION_LABEL.good,
    icon: IconUserCheck,
    text: 'text-good-fg',
    border: 'border-good',
    tint: 'bg-good/15',
  },
  evil: {
    label: FACTION_LABEL.evil,
    icon: IconUserX,
    text: 'text-evil-fg',
    border: 'border-evil',
    tint: 'bg-evil/15',
  },
}

/** Colour for a quest result headline: green for 任務成功, red for 「N 張失敗」. */
export function questResultText(fails: number): string {
  return fails === 0 ? 'text-success-fg' : 'text-fail-fg'
}

/** The played quest cards, successes first. `small` for the history list. */
export function QuestCards({
  size,
  fails,
  small = false,
}: {
  size: number
  fails: number
  small?: boolean
}) {
  return (
    <ul className={cx('flex flex-wrap gap-2', !small && 'justify-center')} aria-label="出的牌">
      {playedCards(size, fails).map((card, i) => {
        const { label, icon: CardIcon, text, border, tint } = QUEST_CARD[card]
        return (
          <li
            key={i}
            aria-label={label}
            className={cx(
              // Same look as the choice buttons: coloured border, tint and icon.
              'flex items-center justify-center rounded-xl border-2',
              small ? 'h-10 w-7 rounded-lg' : 'h-20 w-14',
              border,
              tint,
            )}
          >
            <CardIcon size={small ? 16 : 28} className={text} aria-hidden />
          </li>
        )
      })}
    </ul>
  )
}
