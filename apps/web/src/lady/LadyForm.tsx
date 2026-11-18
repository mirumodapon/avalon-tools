import {
  playerName,
  type Game,
  type GameState,
  type LadyDeclaration,
  type PlayerId,
} from '@avalon/core'
import { IconSend } from '@tabler/icons-react'
import { useState } from 'react'
import { BottomBar, Button, Card } from '../components/ui.tsx'
import { LadyFields } from './LadyFields.tsx'
import { LadyIcon } from './marks.tsx'

export function LadyForm({
  game,
  state,
  onUse,
}: {
  game: Game
  state: GameState
  onUse: (input: { targetId: PlayerId; declared: LadyDeclaration; note: string }) => void
}) {
  const holderId = state.ladyHolderId!
  const [targetId, setTargetId] = useState<PlayerId | null>(null)
  const [declared, setDeclared] = useState<LadyDeclaration>('none')
  const [note, setNote] = useState('')
  const useNumber = (game.lady?.uses.length ?? 0) + 1

  return (
    <div className="flex flex-1 flex-col">
      <Card className="mb-4 flex items-center gap-3">
        <LadyIcon size={32} />
        <div className="min-w-0">
          <p className="font-semibold">
            湖中女神・第 {useNumber} 次（任務 {state.questIndex + 1} 後）
          </p>
          <p className="truncate text-sm text-subtext0">持有者：{playerName(game, holderId)}</p>
        </div>
      </Card>
      <LadyFields
        game={game}
        index={game.lady?.uses.length ?? 0}
        holderId={holderId}
        targetId={targetId}
        declared={declared}
        note={note}
        onTarget={setTargetId}
        onDeclared={setDeclared}
        onNote={setNote}
      />
      <div className="flex-1" />
      <BottomBar>
        <Button
          variant="primary"
          className="w-full"
          disabled={!targetId}
          onClick={() => targetId && onUse({ targetId, declared, note: note.trim() })}
        >
          <IconSend size={20} aria-hidden />
          {targetId ? '送出查驗' : '選擇查驗對象'}
        </Button>
      </BottomBar>
    </div>
  )
}
