/**
 * The repo has one version: the root package.json. Workspace packages (and the
 * new:app template) must not declare their own.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const manifests = [
  ...['apps', 'packages'].flatMap((d) =>
    readdirSync(join(root, d)).map((n) => join(root, d, n, 'package.json')),
  ),
  join(root, 'scripts/templates/app/package.json.tmpl'),
].filter((p) => existsSync(p))

const problems: string[] = []
const rootPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version?: string }
if (!/^\d+\.\d+\.\d+$/.test(rootPkg.version ?? ''))
  problems.push('package.json: version must be x.y.z')
for (const p of manifests) {
  if ('version' in JSON.parse(readFileSync(p, 'utf8'))) {
    problems.push(
      `${relative(root, p)}: remove "version" (the repo version is in the root package.json)`,
    )
  }
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
