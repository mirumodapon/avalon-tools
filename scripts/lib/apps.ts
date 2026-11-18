/** The apps to build and serve: registry tools that are not coming-soon and exist in apps/. */
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { builtTools } from '../../packages/registry/src/index.ts'
import type { ToolMeta } from '../../packages/registry/src/index.ts'

export const root = resolve(new URL('../..', import.meta.url).pathname)
export const distDir = join(root, 'dist')

export function appDir(tool: ToolMeta): string {
  return join(root, 'apps', tool.id)
}

export function packageName(tool: ToolMeta): string {
  return `@avalon/${tool.id}`
}

/** Built tools with an app, nested paths last so a parent never overwrites them. */
export function apps(only: readonly string[] = []): ToolMeta[] {
  return builtTools()
    .filter((t) => existsSync(join(appDir(t), 'package.json')))
    .filter((t) => !only.length || only.includes(t.id))
    .toSorted((a, b) => a.path.length - b.path.length)
}

/** The app serving a URL path: the tool with the longest path prefix. */
export function appForPath(list: readonly ToolMeta[], pathname: string): ToolMeta | undefined {
  const dir = pathname.endsWith('/') ? pathname : `${pathname}/`
  return list
    .filter((t) => dir.startsWith(t.path))
    .toSorted((a, b) => b.path.length - a.path.length)[0]
}
