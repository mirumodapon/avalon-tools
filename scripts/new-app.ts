/**
 * Scaffolds a new tool:
 *
 *   pnpm new:app <id> [--name 名稱] [--description 說明] [--icon IconName] [--accent blue]
 *
 * 1. copies scripts/templates/app → apps/<id>
 * 2. adds the tool to packages/registry (or turns its coming-soon entry into beta)
 * 3. adds its icon to home's icon map
 * 4. installs dependencies and generates its PWA icons
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ID_PATTERN, tools } from '../packages/registry/src/index.ts'
import { root } from './lib/apps.ts'

const MARKER = '  // new:app inserts here'
const ICONS_MARKER = '  // new:app icons'

/** A single-quoted TS string literal. */
const q = (s: string) => `'${s.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`

function option(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i > -1 ? process.argv[i + 1] : undefined
}

function fail(message: string): never {
  console.error(`new:app: ${message}`)
  process.exit(1)
}

const id = process.argv[2]
if (!id || id.startsWith('--'))
  fail(
    'usage: pnpm new:app <id> [--name 名稱] [--description 說明] [--icon IconName] [--accent blue]',
  )
if (!ID_PATTERN.test(id)) fail(`id must match ${ID_PATTERN} (got ${id})`)
const target = join(root, 'apps', id)
if (existsSync(target)) fail(`apps/${id} already exists`)

const existing = tools.find((t) => t.id === id)
if (existing && existing.status !== 'coming-soon')
  fail(`${id} is already a ${existing.status} tool`)

const meta = {
  name: option('--name') ?? existing?.name ?? id,
  description: option('--description') ?? existing?.description ?? '',
  icon: option('--icon') ?? existing?.icon ?? 'IconTool',
  accent: option('--accent') ?? existing?.accent ?? 'blue',
}

const tablerDir = join(root, 'packages/registry/node_modules/@tabler/icons-react/dist/esm/icons')
if (!existsSync(join(tablerDir, `${meta.icon}.mjs`))) fail(`unknown Tabler icon ${meta.icon}`)

// 1. app files
const template = join(root, 'scripts/templates/app')
const fill = (s: string) =>
  s
    .replaceAll('__ID__', id)
    .replaceAll('__NAME__', meta.name)
    .replaceAll('__DESCRIPTION__', meta.description)
function copy(from: string, to: string) {
  mkdirSync(to, { recursive: true })
  for (const entry of readdirSync(from)) {
    const src = join(from, entry)
    if (statSync(src).isDirectory()) copy(src, join(to, entry))
    else writeFileSync(join(to, entry.replace(/\.tmpl$/, '')), fill(readFileSync(src, 'utf8')))
  }
}
copy(template, target)

// 2. registry
const toolsFile = join(root, 'packages/registry/src/tools.ts')
let registry = readFileSync(toolsFile, 'utf8')
if (existing) {
  const start = registry.indexOf(`    id: '${id}',`)
  const end = registry.indexOf('  },', start)
  const entry = registry.slice(start, end).replace(/status: '[^']*'/, "status: 'beta'")
  registry = registry.slice(0, start) + entry + registry.slice(end)
} else {
  if (!registry.includes(MARKER)) fail(`marker "${MARKER.trim()}" not found in tools.ts`)
  registry = registry.replace(
    MARKER,
    `  {
    id: ${q(id)},
    name: ${q(meta.name)},
    shortName: ${q(meta.name)},
    description: ${q(meta.description)},
    path: '/${id}/',
    icon: ${q(meta.icon)},
    accent: ${q(meta.accent)},
    status: 'beta',
  },
${MARKER}`,
  )
}
writeFileSync(toolsFile, registry)

// 3. home's icon map
const iconsFile = join(root, 'apps/home/src/toolIcons.ts')
let icons = readFileSync(iconsFile, 'utf8')
if (!new RegExp(`\\b${meta.icon}\\b`).test(icons)) {
  if (!icons.includes(ICONS_MARKER))
    fail(`marker "${ICONS_MARKER.trim()}" not found in toolIcons.ts`)
  icons = icons
    .replace(
      /(import \{)([^}]*)(\} from '@tabler\/icons-react')/,
      (_, a: string, names: string, b: string) => {
        const list = names
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean)
        const type = list.filter((n) => n.startsWith('type '))
        const values = [...list.filter((n) => !n.startsWith('type ')), meta.icon].toSorted()
        return `${a} ${[...values, ...type].join(', ')} ${b}`
      },
    )
    .replace(ICONS_MARKER, `  ${meta.icon},\n${ICONS_MARKER}`)
  writeFileSync(iconsFile, icons)
}

// 4. dependencies, icons, formatting
const run = (cmd: string, args: string[]) =>
  execFileSync(cmd, args, { cwd: root, stdio: 'inherit' })
run('pnpm', ['install'])
run('node', ['packages/pwa/scripts/icons.ts', id])
run('pnpm', [
  'exec',
  'oxfmt',
  `apps/${id}`,
  'packages/registry/src/tools.ts',
  'apps/home/src/toolIcons.ts',
])

console.warn(`
已建立 apps/${id}（/${id}/，beta）
  pnpm dev               在 http://localhost:5173/${id}/ 開發
  pnpm build             建置並組合 dist/
  packages/registry/src/tools.ts 可調整名稱、說明、圖示與顏色；改圖示或顏色後執行 pnpm icons ${id}`)
