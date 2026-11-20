import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: 'pass-play',
    environment: 'jsdom',
  },
})
