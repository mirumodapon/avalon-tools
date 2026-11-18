/**
 * Builds every app and assembles one site in dist/:
 *   dist/            ← apps/home/dist
 *   dist/record/     ← apps/record/dist   (each tool at its registry path)
 *   dist/404.html    ← home's index.html  (GitHub Pages serves it for unknown paths)
 *
 *   node scripts/build-all.ts [--skip-build]
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { appDir, apps, distDir, packageName, root } from './lib/apps.ts'

const list = apps()
if (!list.some((t) => t.path === '/')) throw new Error('home (path /) has no app to build')

if (!process.argv.includes('--skip-build')) {
  const filters = list.flatMap((t) => ['--filter', packageName(t)])
  execFileSync('pnpm', [...filters, 'run', 'build'], { cwd: root, stdio: 'inherit' })
}

rmSync(distDir, { recursive: true, force: true })
const problems: string[] = []
for (const tool of list) {
  const from = join(appDir(tool), 'dist')
  const to = join(distDir, tool.path)
  for (const f of ['index.html', 'manifest.webmanifest', 'sw.js']) {
    if (!existsSync(join(from, f))) problems.push(`${tool.id}: dist/${f} is missing`)
  }
  cpSync(from, to, { recursive: true })
  console.warn(`dist${tool.path} ← apps/${tool.id}/dist`)
}
copyFileSync(join(distDir, 'index.html'), join(distDir, '404.html'))

// A worker must never precache another app's files.
for (const tool of list) {
  const sw = readFileSync(join(distDir, tool.path, 'sw.js'), 'utf8')
  for (const other of list.filter((o) => o.path !== tool.path && o.path.startsWith(tool.path))) {
    const nested = other.path.slice(tool.path.length)
    if (sw.includes(`url:"${nested}`)) problems.push(`${tool.id}: sw.js precaches ${other.path}`)
  }
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.warn(`dist/404.html ← home; ${list.length} apps`)
