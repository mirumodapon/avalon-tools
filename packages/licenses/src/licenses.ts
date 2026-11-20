/**
 * Third-party license notices for what a build actually ships: find the npm packages
 * behind the bundled modules, check their licenses against an allowlist, and render one
 * plain-text notice file with every license text (and Apache NOTICE file).
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Licenses the site may ship. All permissive: they only ask for the license text (and,
 * for Apache-2.0, the NOTICE file) to travel with the code. Copyleft licenses (GPL, LGPL,
 * EPL, MPL…) are left out on purpose; a dual-licensed package passes when one of its
 * options is here, and that option is the one we use.
 */
export const ALLOWED_LICENSES = [
  'MIT',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'Apache-2.0',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'Unlicense',
  'Zlib',
] as const

const MARKER = '/node_modules/'

/** The npm package a bundled module comes from, or null for our own and virtual modules. */
export function packageOf(moduleId: string): { name: string; dir: string } | null {
  const id = moduleId
    .replace(/^\0/, '')
    .replace(/[?#].*$/, '')
    .replaceAll('\\', '/')
  const at = id.lastIndexOf(MARKER)
  if (at === -1) return null
  const rest = id.slice(at + MARKER.length).split('/')
  const name = rest[0]?.startsWith('@') ? `${rest[0]}/${rest[1]}` : rest[0]
  if (!name || name.startsWith('.')) return null
  return { name, dir: id.slice(0, at + MARKER.length + name.length) }
}

const allowed = (id: string) => (ALLOWED_LICENSES as readonly string[]).includes(id)

/** NOTICE files go after the license texts. */
const noticeLast = (n: string) => (/^notice/i.test(n) ? 1 : 0)

/**
 * The license we use a package under, from its SPDX expression: the expression itself
 * when allowed, the first allowed option of an `OR`, or null when nothing is allowed.
 * `AND` needs every part allowed.
 */
export function chooseLicense(expression: string): string | null {
  const clean = expression.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()
  for (const option of clean.split(/ OR /i)) {
    const parts = option.split(/ AND /i).map((p) => p.trim())
    if (parts.every(allowed)) return option.trim()
  }
  return null
}

export interface PackageNotice {
  name: string
  version: string
  /** The SPDX expression the package declares. */
  declared: string
  /** The option we use it under (differs from `declared` for dual licenses). */
  license: string | null
  homepage: string | null
  /** LICENSE / COPYING / NOTICE files, in that order. */
  files: { name: string; text: string }[]
}

interface PackageJson {
  name?: string
  version?: string
  license?: string | { type?: string }
  licenses?: { type?: string }[]
  homepage?: string
  repository?: string | { url?: string }
}

function declaredLicense(pkg: PackageJson): string {
  if (typeof pkg.license === 'string') return pkg.license
  if (pkg.license?.type) return pkg.license.type
  const list = (pkg.licenses ?? []).map((l) => l.type).filter(Boolean)
  return list.length ? list.join(' OR ') : 'UNKNOWN'
}

const LICENSE_FILE = /^(licen[cs]e|copying|notice)/i

/**
 * The license named by a license file, for packages whose package.json declares none.
 * Only recognises texts that identify themselves unambiguously.
 */
export function detectLicense(text: string): string | null {
  if (/\bMIT License\b/i.test(text) && /Permission is hereby granted/.test(text)) return 'MIT'
  if (/Apache License,?\s+Version 2\.0/i.test(text)) return 'Apache-2.0'
  if (/^ISC License/im.test(text)) return 'ISC'
  return null
}

/** Reads a package's metadata and license files from its folder. */
export function readPackage(dir: string): PackageNotice {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as PackageJson
  const files = readdirSync(dir)
    .filter((n) => LICENSE_FILE.test(n))
    .toSorted((a, b) => noticeLast(a) - noticeLast(b) || a.localeCompare(b))
    .map((n) => ({ name: n, text: readFileSync(join(dir, n), 'utf8').trim() }))
  let declared = declaredLicense(pkg)
  if (declared === 'UNKNOWN') {
    const detected = files.map((f) => detectLicense(f.text)).find(Boolean)
    if (detected) declared = detected
  }
  const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url
  return {
    name: pkg.name ?? dir,
    version: pkg.version ?? '',
    declared,
    license: chooseLicense(declared),
    homepage: pkg.homepage ?? repo ?? null,
    files,
  }
}

const RULE = '='.repeat(72)

/** The notice file: a list of every package, then each package's license texts. */
export function renderNotices(title: string, packages: readonly PackageNotice[]): string {
  const sorted = packages.toSorted((a, b) => a.name.localeCompare(b.name))
  const lines = [
    `${title}：第三方授權聲明`,
    '',
    '本專案以 MIT 授權釋出。以下是建置後實際包含在網站中的第三方套件，以及它們的授權條款。',
    '',
    ...sorted.map((p) => {
      const used = p.license && p.license !== p.declared ? `（以 ${p.license} 使用）` : ''
      return `- ${p.name}@${p.version}：${p.declared}${used}`
    }),
  ]
  for (const p of sorted) {
    lines.push('', RULE, `${p.name}@${p.version}`, `License: ${p.declared}`)
    if (p.license && p.license !== p.declared) lines.push(`Used under: ${p.license}`)
    if (p.homepage) lines.push(`Source: ${p.homepage}`)
    lines.push(RULE)
    if (p.files.length === 0) lines.push('', `（套件未附授權檔，授權為 ${p.declared}）`)
    for (const f of p.files) lines.push('', `--- ${f.name} ---`, '', f.text)
  }
  return `${lines.join('\n')}\n`
}
