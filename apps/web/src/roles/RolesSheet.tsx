import { defaultRoleConfig, type Game, type GameAction } from '@avalon/core'
import { IconEyeOff, IconMasksTheater } from '@tabler/icons-react'
import { useState } from 'react'
import { Sheet } from '../components/Sheet.tsx'
import { Button, SectionTitle, Switch } from '../components/ui.tsx'
import { RoleAssignmentEditor } from './RoleAssignmentEditor.tsx'
import { RoleConfigEditor } from './RoleConfigEditor.tsx'

/**
 * In-game role editor. Roles stay hidden until the recorder explicitly reveals
 * them, to avoid leaking information at the table.
 */
export function RolesSheet({
  game,
  open,
  onClose,
  dispatch,
}: {
  game: Game
  open: boolean
  onClose: () => void
  dispatch: (action: GameAction) => void
}) {
  const [revealed, setRevealed] = useState(false)
  const close = () => {
    setRevealed(false)
    onClose()
  }
  return (
    <Sheet title="角色" open={open} onClose={close}>
      {!revealed ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <IconEyeOff size={40} className="text-overlay1" aria-hidden />
          <p className="text-subtext1">角色資訊目前隱藏，避免被其他玩家看到。</p>
          <Button variant="primary" onClick={() => setRevealed(true)}>
            <IconMasksTheater size={20} aria-hidden />
            顯示並編輯角色
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <section>
            <SectionTitle>角色配置</SectionTitle>
            <Switch
              label="設定角色配置"
              checked={game.roleConfig !== null}
              onChange={(on) =>
                dispatch({
                  type: 'setRoleConfig',
                  roleConfig: on ? defaultRoleConfig(game.players.length) : null,
                })
              }
            />
            {game.roleConfig && (
              <div className="mt-2">
                <RoleConfigEditor
                  config={game.roleConfig}
                  playerCount={game.players.length}
                  onChange={(roleConfig) => dispatch({ type: 'setRoleConfig', roleConfig })}
                />
              </div>
            )}
          </section>
          <section>
            <SectionTitle>角色指派</SectionTitle>
            <RoleAssignmentEditor
              players={game.players}
              assignment={game.roleAssignment}
              config={game.roleConfig}
              onChange={(roleAssignment) => dispatch({ type: 'setRoleAssignment', roleAssignment })}
            />
          </section>
        </div>
      )}
    </Sheet>
  )
}
