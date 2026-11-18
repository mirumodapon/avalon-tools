import { TOOLS } from './tools.ts'
import type { ToolMeta } from './types.ts'

export const ID_PATTERN = /^[a-z][a-z0-9-]*$/

/** Every registered tool, home included. */
export const tools: readonly ToolMeta[] = TOOLS

export function toolById(id: string): ToolMeta {
  const t = tools.find((x) => x.id === id)
  if (!t) throw new Error(`Unknown tool: ${id}`)
  return t
}

/** Tools that have an app to build and serve (everything except coming-soon). */
export function builtTools(list: readonly ToolMeta[] = tools): ToolMeta[] {
  return list.filter((t) => t.status !== 'coming-soon')
}

/** Tools listed on the home page (home itself excluded). */
export function listedTools(list: readonly ToolMeta[] = tools): ToolMeta[] {
  return list.filter((t) => t.id !== 'home')
}

/** The PWA name: home keeps its own name, tools are prefixed with 阿瓦隆・. */
export function manifestName(t: ToolMeta): string {
  return t.path === '/' ? t.name : `阿瓦隆・${t.name}`
}

/**
 * Paths of other tools nested inside `t`'s scope. Their navigations must not be
 * answered by `t`'s service worker (e.g. home's `/` scope covers `/record/`).
 */
export function nestedToolPaths(t: ToolMeta, list: readonly ToolMeta[] = tools): string[] {
  return list
    .filter((o) => o.id !== t.id && o.path !== t.path && o.path.startsWith(t.path))
    .map((o) => o.path)
}

/** Validates the list; returns human-readable problems (empty when valid). */
export function validateTools(list: readonly ToolMeta[]): string[] {
  const problems: string[] = []
  const seen = (key: 'id' | 'path') => {
    const counts = new Map<string, number>()
    for (const t of list) counts.set(t[key], (counts.get(t[key]) ?? 0) + 1)
    for (const [v, n] of counts) if (n > 1) problems.push(`duplicate ${key}: ${v}`)
  }
  seen('id')
  seen('path')
  for (const t of list) {
    if (!ID_PATTERN.test(t.id))
      problems.push(`${t.id}: id must be lowercase letters, digits and dashes`)
    const expected = t.id === 'home' ? '/' : `/${t.id}/`
    if (t.path !== expected) problems.push(`${t.id}: path must be ${expected} (got ${t.path})`)
    if (!/^Icon[A-Z][A-Za-z0-9]*$/.test(t.icon))
      problems.push(`${t.id}: icon must be a Tabler component name`)
    if (!t.name.trim() || !t.shortName.trim())
      problems.push(`${t.id}: name and shortName are required`)
  }
  if (!list.some((t) => t.id === 'home')) problems.push('home is required')
  return problems
}
