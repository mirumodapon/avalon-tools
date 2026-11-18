/**
 * Workspace boundaries:
 * - apps/* never import another app (by package name or by a relative path out of the app)
 * - packages/* never import an app
 * - pure packages (avalon-rules, record-core) stay free of React, the DOM and icon sets
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const dirs = (d: string) =>
  readdirSync(join(root, d)).filter((n) => statSync(join(root, d, n)).isDirectory())
const apps = dirs('apps')
const appPackages = new Set(
  apps.map(
    (a) =>
      (JSON.parse(readFileSync(join(root, 'apps', a, 'package.json'), 'utf8')) as { name: string })
        .name,
  ),
)
const PURE = new Set(['avalon-rules', 'record-core'])
const UI_ONLY = [/^react(-dom)?(\/|$)/, /^@tabler\//, /^zustand/, /^dexie/]

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (n === 'node_modules' || n === 'dist') return []
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(n) ? [p] : []
  })
}

const IMPORT = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g
const problems: string[] = []

for (const [kind, name] of [
  ...apps.map((a) => ['apps', a]),
  ...dirs('packages').map((p) => ['packages', p]),
]) {
  const base = join(root, kind!, name!)
  const src = join(base, 'src')
  let list: string[]
  try {
    list = files(src)
  } catch {
    continue
  }
  for (const file of list) {
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(IMPORT)) {
      const spec = m[1] ?? m[2]!
      const where = relative(root, file)
      if (appPackages.has(spec)) problems.push(`${where}: imports app package ${spec}`)
      if (spec.startsWith('.')) {
        const target = resolve(file, '..', spec)
        const leavesHome = !target.startsWith(base + sep)
        if (leavesHome && target.startsWith(join(root, 'apps') + sep)) {
          problems.push(`${where}: reaches into another app via ${spec}`)
        }
      }
      if (kind === 'packages' && PURE.has(name!) && UI_ONLY.some((re) => re.test(spec))) {
        problems.push(`${where}: pure package imports ${spec}`)
      }
    }
  }
}

if (problems.length) {
  console.error(`Workspace boundary violations:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
