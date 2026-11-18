import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/** The repo's single version, from the root package.json (no app has its own). */
export function repoVersion(): string {
  const root = new URL('../../../package.json', import.meta.url)
  return (JSON.parse(readFileSync(root, 'utf8')) as { version: string }).version
}

/** Short commit hash of the build; falls back to the CI SHA or "dev" outside git. */
export function gitRev(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev'
  }
}

/** `<repo version>-<git rev>`, injected into every app as `__APP_VERSION__`. */
export function buildVersion(): string {
  return `${repoVersion()}-${gitRev()}`
}
