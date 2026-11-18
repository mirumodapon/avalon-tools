/**
 * Fails when a package.json pins an external dependency itself instead of using
 * the pnpm catalog in pnpm-workspace.yaml ("catalog:"). Workspace packages are exempt.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const manifests = [
  'package.json',
  ...['apps', 'packages'].flatMap((dir) =>
    readdirSync(join(root, dir)).map((name) => join(dir, name, 'package.json')),
  ),
]
const sections = ['dependencies', 'devDependencies', 'optionalDependencies'] as const

const problems: string[] = []
for (const file of manifests) {
  let pkg: Partial<Record<(typeof sections)[number], Record<string, string>>>
  try {
    pkg = JSON.parse(readFileSync(join(root, file), 'utf8'))
  } catch {
    continue
  }
  for (const section of sections) {
    for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
      if (!spec.startsWith('catalog:') && !spec.startsWith('workspace:')) {
        problems.push(`${file} ${section}.${name} = "${spec}" (use "catalog:")`)
      }
    }
  }
}

if (problems.length) {
  console.error(`Dependencies must come from the pnpm catalog:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
