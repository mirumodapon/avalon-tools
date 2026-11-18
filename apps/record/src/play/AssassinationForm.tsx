import type { Game, PlayerId } from '@avalon/record-core'
import { IconSword, IconTarget } from '@tabler/icons-react'
import { BottomBar, Button, Card, cx, SectionTitle, Segmented } from '@avalon/ui'
import { usePersistentState } from '../session/usePersistentState.ts'
import { SeatGrid, SeatNo } from './ProposalForm.tsx'

export function AssassinationForm({
  game,
  onSubmit,
}: {
  game: Game
  onSubmit: (input: { targetId: PlayerId | null; manualHit: boolean | null }) => void
}) {
  const [targetId, setTargetId] = usePersistentState<PlayerId | null>(
    'assassin-target',
    game.id,
    game.assassination?.targetId ?? null,
  )
  const [hit, setHit] = usePersistentState<'hit' | 'miss' | null>('assassin-hit', game.id, null)
  const merlinId = Object.entries(game.roleAssignment).find(([, r]) => r === 'merlin')?.[0]
  const autoJudged = merlinId !== undefined
  const ready = targetId !== null && (autoJudged || hit !== null)

  return (
    <div className="flex flex-1 flex-col">
      <Card className="mb-3 flex items-center gap-3">
        <IconSword size={28} className="shrink-0 text-evil-fg" aria-hidden />
        <p className="text-sm">好人完成 3 個任務！刺客指認梅林，刺中則壞人逆轉勝。</p>
      </Card>

      <SectionTitle>刺殺目標</SectionTitle>
      <SeatGrid>
        {game.players.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={targetId === p.id}
            onClick={() => setTargetId(p.id)}
            className={cx(
              'flex min-h-14 items-center gap-2 rounded-xl border-2 px-3 text-left',
              targetId === p.id ? 'border-evil bg-evil/15' : 'border-transparent bg-surface0',
            )}
          >
            <SeatNo n={i + 1} />
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            {targetId === p.id && <IconTarget size={20} className="text-evil-fg" aria-hidden />}
          </button>
        ))}
      </SeatGrid>

      <div className="mt-4">
        {autoJudged ? (
          <p className="text-sm text-subtext0">已指派梅林，將自動判定是否刺中。</p>
        ) : (
          <>
            <SectionTitle>結果</SectionTitle>
            <Segmented
              label="刺殺結果"
              value={hit ?? ''}
              options={[
                { value: 'hit', label: '刺中梅林' },
                { value: 'miss', label: '沒刺中' },
              ]}
              onChange={(v) => setHit(v as 'hit' | 'miss')}
            />
          </>
        )}
      </div>

      <div className="flex-1" />
      <BottomBar>
        <Button
          variant="primary"
          className="w-full"
          disabled={!ready}
          onClick={() =>
            onSubmit({
              targetId,
              manualHit: autoJudged ? null : hit === null ? null : hit === 'hit',
            })
          }
        >
          <IconSword size={20} aria-hidden />
          確認刺殺
        </Button>
      </BottomBar>
    </div>
  )
}
