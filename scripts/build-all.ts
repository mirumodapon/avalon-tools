/**
 * Builds every app and assembles one site in dist/:
 *   dist/            ← apps/home/dist
 *   dist/record/     ← apps/record/dist   (each tool at its registry path)
 *   dist/docs/       ← apps/docs/dist     (the VitePress docs: no manifest, no service worker)
 * Every app carries its own licenses.txt (third-party notices, see @avalon/licenses).
 *   dist/404.html    ← home's index.html  (GitHub Pages serves it for unknown paths)
 *
 *   node scripts/build-all.ts [--skip-build]
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { LICENSES_FILE } from '../packages/licenses/src/vite.ts'
import { isPwa } from '../packages/registry/src/index.ts'
import { appDir, apps, distDir, packageName, root } from './lib/apps.ts'

const list = apps()
if (!list.some((t) => t.path === '/')) throw new Error('home (path /) has no app to build')

if (!process.argv.includes('--skip-build')) {
  const filters = list.flatMap((t) => ['--filter', packageName(t)])
  execFileSync('pnpm', [...filters, 'run', 'build'], { cwd: root, stdio: 'inherit' })
}

rmSync(distDir, { recursive: true, force: true })
const problems: string[] = []
const PWA_FILES = ['manifest.webmanifest', 'sw.js']
for (const tool of list) {
  const from = join(appDir(tool), 'dist')
  const to = join(distDir, tool.path)
  for (const f of ['index.html', LICENSES_FILE]) {
    if (!existsSync(join(from, f))) problems.push(`${tool.id}: dist/${f} is missing`)
  }
  for (const f of PWA_FILES) {
    const present = existsSync(join(from, f))
    if (isPwa(tool) && !present) problems.push(`${tool.id}: dist/${f} is missing`)
    // The docs are never installable or cached by a worker of their own.
    if (!isPwa(tool) && present) problems.push(`${tool.id}: dist/${f} must not exist`)
  }
  cpSync(from, to, { recursive: true })
  console.warn(`dist${tool.path} ← apps/${tool.id}/dist`)
}
copyFileSync(join(distDir, 'index.html'), join(distDir, '404.html'))

// A worker must never precache another app's files, nor answer its navigations (home's
// scope `/` covers `/record/`, `/docs/`, …; the docs must always come from the network).
for (const tool of list.filter(isPwa)) {
  const sw = readFileSync(join(distDir, tool.path, 'sw.js'), 'utf8')
  for (const other of list.filter((o) => o.path !== tool.path && o.path.startsWith(tool.path))) {
    const nested = other.path.slice(tool.path.length)
    if (sw.includes(`url:"${nested}`)) problems.push(`${tool.id}: sw.js precaches ${other.path}`)
    // Ids are lowercase letters, digits and dashes, so the pattern needs no escaping.
    const deny = `/^\\/${other.id}(\\/|$)/`
    if (!sw.includes(deny))
      problems.push(`${tool.id}: sw.js does not deny navigations to ${other.path}`)
  }
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.warn(`dist/404.html ← home; ${list.length} apps`)
