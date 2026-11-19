import { FACTION_LABEL, type Faction } from '@avalon/rules'
import { cx, FACTION_ICONS } from '@avalon/ui'
import { IconCheck, IconX, type Icon } from '@tabler/icons-react'
import { playedCards, type QuestCard } from '../quest/quest.ts'

/** How each quest card looks, wherever it is shown (playing, result, history). */
export const QUEST_CARD: Record<
  QuestCard,
  { label: string; icon: Icon; text: string; border: string }
> = {
  success: {
    label: '任務成功',
    icon: IconCheck,
    text: 'text-success-fg',
    border: 'border-success',
  },
  fail: { label: '任務失敗', icon: IconX, text: 'text-fail-fg', border: 'border-fail' },
}

/** How each Lady of the Lake answer looks. */
export const LADY_MARK: Record<
  Faction,
  { label: string; icon: Icon; text: string; border: string }
> = {
  good: {
    label: FACTION_LABEL.good,
    icon: FACTION_ICONS.good,
    text: 'text-good-fg',
    border: 'border-good',
  },
  evil: {
    label: FACTION_LABEL.evil,
    icon: FACTION_ICONS.evil,
    text: 'text-evil-fg',
    border: 'border-evil',
  },
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
        const { label, icon: CardIcon, text, border } = QUEST_CARD[card]
        return (
          <li
            key={i}
            aria-label={label}
            className={cx(
              'flex items-center justify-center rounded-xl border-2 bg-mantle',
              small ? 'h-10 w-7 rounded-lg' : 'h-20 w-14',
              border,
              text,
            )}
          >
            <CardIcon size={small ? 16 : 28} aria-hidden />
          </li>
        )
      })}
    </ul>
  )
}
