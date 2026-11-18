import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { useGames } from './games/store.ts'

beforeEach(() => {
  useGames.setState({ ready: true, storageError: null })
})
afterEach(() => cleanup())
