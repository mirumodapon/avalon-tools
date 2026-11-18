import { assassinationHit, deriveState, renderName, type GameAction } from '@avalon/record-core'
import { IconArrowBackUp, IconDeviceFloppy, IconSword } from '@tabler/icons-react'
import { useState } from 'react'
import { Page } from '../components/Layout.tsx'
import { SelectField } from '../components/Select.tsx'
import { BottomBar, Button, Card, SectionTitle, Segmented } from '../components/ui.tsx'
import { useGame, useGames } from '../games/store.ts'
import { GameInfoEditor } from '../naming/GameInfoEditor.tsx'
import { FinishedPanel } from '../play/FinishedPanel.tsx'
import { RoleAssignmentEditor } from '../roles/RoleAssignmentEditor.tsx'
import { navigate } from '../router.ts'
import { useSettings } from '../settings/store.ts'
import { NotFoundPage } from './NotFoundPage.tsx'

/** Settlement: confirm the result, fill in roles, name and note, then save. */
export function SummaryPage({ id }: { id: string }) {
  const game = useGame(id)
  const dispatchGame = useGames((s) => s.dispatch)
  const naming = useSettings((s) => s.settings.naming)
  const [error, setError] = useState<string | null>(null)
  if (!game) return <NotFoundPage message="找不到這場遊戲" />
  const s = deriveState(game)

  function dispatch(action: GameAction) {
    try {
      dispatchGame(id, action)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  if (s.phase !== 'finished') {
    return (
      <Page title="結算" back={{ name: 'play', id }}>
        <Card className="mt-4 text-center">
          <p className="mb-3">遊戲尚未結束，無法結算。</p>
          <Button variant="primary" onClick={() => navigate({ name: 'play', id })}>
            回到記錄
          </Button>
        </Card>
      </Page>
    )
  }

  function save() {
    if (!game) return
    const auto = renderName(naming, {
      startedAt: new Date(game.createdAt),
      seq: game.name.seq,
      players: game.players.length,
      winner: s.winner,
    })
    dispatch({ type: 'setAutoName', auto })
    dispatch({ type: 'markSaved' })
    navigate({ name: 'game', id }, { replace: true })
  }

  const merlinKnown = Object.values(game.roleAssignment).includes('merlin')
  const assassination = game.assassination

  return (
    <Page title="結算" back={{ name: 'play', id }}>
      <div className="space-y-4 pt-2">
        {error && (
          <p role="alert" className="rounded-xl border border-fail p-3 text-sm text-fail-fg">
            {error}
          </p>
        )}
        <FinishedPanel game={game} />

        {assassination && (
          <Card>
            <SectionTitle>
              <span className="flex items-center gap-1">
                <IconSword size={16} aria-hidden />
                刺殺
              </span>
            </SectionTitle>
            <SelectField
              label="刺殺目標"
              value={assassination.targetId}
              options={game.players.map((p) => ({ value: p.id, label: p.name }))}
              onChange={(targetId) =>
                dispatch({ type: 'assassinate', targetId, manualHit: assassination.manualHit })
              }
            />
            {merlinKnown ? (
              <p className="mt-2 text-sm text-subtext0">
                已指派梅林，自動判定：{assassinationHit(game, assassination) ? '刺中' : '沒刺中'}
              </p>
            ) : (
              <Segmented
                className="mt-2"
                label="刺殺結果"
                value={assassination.manualHit ? 'hit' : 'miss'}
                options={[
                  { value: 'hit', label: '刺中梅林' },
                  { value: 'miss', label: '沒刺中' },
                ]}
                onChange={(v) =>
                  dispatch({
                    type: 'assassinate',
                    targetId: assassination.targetId,
                    manualHit: v === 'hit',
                  })
                }
              />
            )}
          </Card>
        )}

        <Card>
          <SectionTitle>角色指派（可只填部分）</SectionTitle>
          <RoleAssignmentEditor
            players={game.players}
            assignment={game.roleAssignment}
            config={game.roleConfig}
            onChange={(roleAssignment) => dispatch({ type: 'setRoleAssignment', roleAssignment })}
          />
        </Card>

        <Card>
          <SectionTitle>名稱與備註</SectionTitle>
          <GameInfoEditor game={game} dispatch={dispatch} />
        </Card>
      </div>

      <BottomBar>
        <div className="flex gap-2">
          <Button onClick={() => navigate({ name: 'play', id })} aria-label="回到記錄">
            <IconArrowBackUp size={20} aria-hidden />
          </Button>
          <Button variant="primary" className="flex-1" onClick={save}>
            <IconDeviceFloppy size={20} aria-hidden />
            保存
          </Button>
        </div>
      </BottomBar>
    </Page>
  )
}
