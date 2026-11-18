import {
  playerName,
  type Game,
  type GameState,
  type LadyDeclaration,
  type PlayerId,
} from '@avalon/record-core'
import { IconSend } from '@tabler/icons-react'
import { BottomBar, Button } from '@avalon/ui'
import { usePersistentState } from '../session/usePersistentState.ts'
import { LadyFields } from './LadyFields.tsx'
import { LadyIcon } from './marks.tsx'

export function LadyForm({
  game,
  state,
  onUse,
}: {
  game: Game
  state: GameState
  onUse: (input: { targetId: PlayerId; declared: LadyDeclaration }) => void
}) {
  const holderId = state.ladyHolderId!
  // Survives closing the app mid-entry; tied to this game's next Lady use.
  const draftKey = `${game.id}:lady${game.lady?.uses.length ?? 0}`
  const [targetId, setTargetId] = usePersistentState<PlayerId | null>('lady-target', draftKey, null)
  const [declared, setDeclared] = usePersistentState<LadyDeclaration>(
    'lady-declared',
    draftKey,
    'none',
  )
  const useNumber = (game.lady?.uses.length ?? 0) + 1

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-1.5 flex items-center gap-2 rounded-xl bg-lady/15 px-3 py-1.5">
        <LadyIcon size={22} />
        <p className="min-w-0 flex-1 truncate text-sm">
          <span className="font-semibold">湖中女神・第 {useNumber} 次</span>
          <span className="text-subtext0">・任務 {state.questIndex + 1} 後</span>
        </p>
        <p className="shrink-0 truncate text-sm">
          持有者 <span className="font-semibold">{playerName(game, holderId)}</span>
        </p>
      </div>
      <LadyFields
        game={game}
        index={game.lady?.uses.length ?? 0}
        holderId={holderId}
        targetId={targetId}
        declared={declared}
        onTarget={setTargetId}
        onDeclared={setDeclared}
      />
      <div className="flex-1" />
      <BottomBar>
        <Button
          variant="primary"
          className="w-full"
          disabled={!targetId}
          onClick={() => targetId && onUse({ targetId, declared })}
        >
          <IconSend size={20} aria-hidden />
          {targetId ? '送出查驗' : '選擇查驗對象'}
        </Button>
      </BottomBar>
    </div>
  )
}
