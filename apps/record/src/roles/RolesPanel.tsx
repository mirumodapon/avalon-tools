import { defaultRoleConfig, type Game, type GameAction } from '@avalon/record-core'
import { IconEyeOff, IconMasksTheater } from '@tabler/icons-react'
import { useState } from 'react'
import { Button, SectionTitle, Switch } from '@avalon/ui'
import { RoleAssignmentEditor } from './RoleAssignmentEditor.tsx'
import { RoleConfigEditor } from './RoleConfigEditor.tsx'

/**
 * In-game role editor. Roles stay hidden until the recorder explicitly reveals
 * them, to avoid leaking information at the table. Remount to hide again.
 */
export function RolesPanel({
  game,
  dispatch,
}: {
  game: Game
  dispatch: (action: GameAction) => void
}) {
  const [revealed, setRevealed] = useState(false)

  if (!revealed) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-mantle py-6 text-center">
        <IconEyeOff size={36} className="text-overlay1" aria-hidden />
        <p className="text-sm text-subtext1">角色資訊目前隱藏，避免被其他玩家看到。</p>
        <Button variant="primary" onClick={() => setRevealed(true)}>
          <IconMasksTheater size={20} aria-hidden />
          顯示並編輯角色
        </Button>
      </div>
    )
  }

  return (
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
  )
}
