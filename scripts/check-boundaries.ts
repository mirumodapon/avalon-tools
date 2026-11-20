/**
 * Workspace boundaries:
 * - apps/* never import another app (by package name or by a relative path out of the app)
 * - packages/* never import an app
 * - pure packages (avalon-rules, record-core) stay free of React, the DOM and icon sets
 * - links into the docs (`docsHref(…)`) go through DocsLink, which always opens a new tab,
 *   never a plain <a> that would navigate an installed app's window to the docs
 * - an app using @avalon/pass-play imports its stylesheet, or Tailwind never sees the
 *   shared cards' classes and they render unstyled
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
    if (n === 'node_modules' || n === 'dist' || n === 'cache') return []
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(n) ? [p] : []
  })
}

/** `<a … href={docsHref(…)}`: a docs link that would open in the same tab. */
const PLAIN_DOCS_LINK = /<a\b[^>]*\bhref=\{\s*docsHref\(/

const IMPORT = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g
const problems: string[] = []

for (const [kind, name] of [
  ...apps.map((a) => ['apps', a]),
  ...dirs('packages').map((p) => ['packages', p]),
]) {
  const base = join(root, kind!, name!)
  // Sources: src/, plus .vitepress/ for the docs site.
  const list = ['src', '.vitepress'].flatMap((d) => {
    try {
      return files(join(base, d))
    } catch {
      return []
    }
  })
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
    if (PLAIN_DOCS_LINK.test(text)) {
      problems.push(`${relative(root, file)}: links the docs with a plain <a>; use DocsLink`)
    }
  }
}

const PASS_PLAY_CSS = "@import '@avalon/pass-play/pass-play.css'"
for (const app of apps) {
  const pkg = JSON.parse(readFileSync(join(root, 'apps', app, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>
  }
  if (!pkg.dependencies?.['@avalon/pass-play']) continue
  let css = ''
  try {
    css = readFileSync(join(root, 'apps', app, 'src/index.css'), 'utf8')
  } catch {
    // no stylesheet: reported below like a missing import
  }
  if (!css.includes(PASS_PLAY_CSS)) {
    problems.push(`apps/${app}/src/index.css: uses @avalon/pass-play but lacks ${PASS_PLAY_CSS}`)
  }
}

if (problems.length) {
  console.error(`Workspace boundary violations:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
