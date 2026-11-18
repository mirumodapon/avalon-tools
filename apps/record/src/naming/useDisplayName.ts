import { deriveState, displayName, type Game } from '@avalon/record-core'
import { useSettings } from '../settings/store.ts'

/** Live display name: custom name, else the current naming template. */
export function useDisplayName(game: Game | undefined): string {
  const naming = useSettings((s) => s.settings.naming)
  if (!game) return ''
  return displayName(game, naming, deriveState(game).winner)
}

export function useNamer(): (game: Game) => string {
  const naming = useSettings((s) => s.settings.naming)
  return (game) => displayName(game, naming, deriveState(game).winner)
}
