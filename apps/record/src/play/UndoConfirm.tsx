import { lastStep, type Game, type LastStep } from '@avalon/record-core'
import { ConfirmSheet } from '../components/Sheet.tsx'

export function describeStep(step: LastStep): string {
  switch (step.kind) {
    case 'assassination':
      return '刺殺結果'
    case 'lady':
      return `任務 ${step.questIndex + 1} 後的湖中女神查驗`
    case 'quest':
      return `任務 ${step.questIndex + 1} 的結果`
    case 'proposal':
      return `任務 ${step.questIndex + 1} 第 ${step.attempt} 次派票`
  }
}

/** Asks before undoing, naming the exact step that will be removed. */
export function UndoConfirm({
  game,
  open,
  onConfirm,
  onClose,
}: {
  game: Game
  open: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const step = lastStep(game)
  return (
    <ConfirmSheet
      open={open && step !== null}
      title="恢復上一步？"
      message={step && `將刪除「${describeStep(step)}」的紀錄。`}
      confirmLabel="恢復"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}
