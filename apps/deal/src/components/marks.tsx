import { FACTION_LABEL, type Faction } from '@avalon/rules'
import { cx } from '@avalon/ui'
import { IconTrophy, IconTrophyOff, IconUserCheck, IconUserX, type Icon } from '@tabler/icons-react'
import { playedCards, type QuestCard } from '@avalon/pass-play'

interface Mark {
  label: string
  icon: Icon
  text: string
  border: string
  /** Tinted background for the quest choice buttons and cards. */
  tint?: string
}

/** How each quest card looks, wherever it is shown: a yellow trophy, or the good faction's blue one crossed out. */
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
    tint: 'bg-quest-fail/15',
  },
}

/**
 * How each Lady of the Lake answer looks: the faction colours of a dealt role card, with
 * the same icons as the game record's Lady results.
 */
export const LADY_MARK: Record<Faction, Mark> = {
  good: {
    label: FACTION_LABEL.good,
    icon: IconUserCheck,
    text: 'text-good-fg',
    border: 'border-good',
  },
  evil: {
    label: FACTION_LABEL.evil,
    icon: IconUserX,
    text: 'text-evil-fg',
    border: 'border-evil',
  },
}

/** Colour for a quest result headline: green for 任務成功, red for 「N 張失敗」. */
export function questResultText(fails: number): string {
  return fails === 0 ? 'text-success-fg' : 'text-fail-fg'
}

/**
 * The played quest cards. Successes first by default; with `cards` (the play order, as
 * saved in the history) they follow that order, numbered by who played them.
 * `small` for the history list.
 */
export function QuestCards({
  size,
  fails,
  cards,
  small = false,
}: {
  size: number
  fails: number
  cards?: readonly QuestCard[]
  small?: boolean
}) {
  const ordered = cards !== undefined
  return (
    <ul className={cx('flex flex-wrap gap-2', !small && 'justify-center')} aria-label="出的牌">
      {(cards ?? playedCards(size, fails)).map((card, i) => {
        const { label, icon: CardIcon, text, border, tint } = QUEST_CARD[card]
        return (
          <li
            key={i}
            aria-label={ordered ? `第 ${i + 1} 位：${label}` : label}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={cx(
                // Same look as the choice buttons: coloured border, tint and icon.
                'flex items-center justify-center rounded-xl border-2',
                small ? 'h-10 w-7 rounded-lg' : 'h-20 w-14',
                border,
                tint,
              )}
            >
              <CardIcon size={small ? 16 : 28} className={text} aria-hidden />
            </span>
            {ordered && (
              <span
                className={cx(
                  'text-subtext0 tabular-nums',
                  small ? 'text-[10px] leading-none' : 'text-sm',
                )}
                aria-hidden
              >
                {i + 1}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
