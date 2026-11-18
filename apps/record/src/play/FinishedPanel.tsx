import { deriveState, playerName, type Game } from '@avalon/record-core'
import { IconMoon, IconSun, IconTrophy } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Card, cx } from '../components/ui.tsx'

const REASON: Record<string, string> = {
  'quests-failed': '3 個任務失敗',
  'forced-rejected': '強制局未通過',
  'assassination-hit': '刺客刺中梅林',
  'assassination-missed': '刺客沒有刺中梅林',
}

export function FinishedPanel({ game, children }: { game: Game; children?: ReactNode }) {
  const s = deriveState(game)
  const good = s.winner === 'good'
  const target = game.assassination?.targetId
  return (
    <Card className={cx('border-2 text-center', good ? 'border-good' : 'border-evil')}>
      <IconTrophy
        size={36}
        className={cx('mx-auto', good ? 'text-good-fg' : 'text-evil-fg')}
        aria-hidden
      />
      <p
        className={cx(
          'mt-1 flex items-center justify-center gap-1 text-2xl font-bold',
          good ? 'text-good-fg' : 'text-evil-fg',
        )}
      >
        {good ? <IconSun aria-hidden /> : <IconMoon aria-hidden />}
        {good ? '好人勝利' : '壞人勝利'}
      </p>
      <p className="mt-1 text-sm text-subtext0">
        {s.winReason && REASON[s.winReason]}
        {target && `（刺殺目標：${playerName(game, target)}）`}
      </p>
      {children}
    </Card>
  )
}
