/**
 * Serves the assembled dist/ the way GitHub Pages does (folders → index.html,
 * unknown paths → 404.html). Run `pnpm build` first.
 *
 *   node scripts/preview.ts [--port 4173]
 */
import { existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { distDir } from './lib/apps.ts'
import { readStatic, resolveStatic } from './lib/static.ts'

const portArg = process.argv.indexOf('--port')
const port = Number(portArg > -1 ? process.argv[portArg + 1] : 4173)

if (!existsSync(distDir)) {
  console.error('dist/ not found: run `pnpm build` first')
  process.exit(1)
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost')
  const hit = await resolveStatic(distDir, pathname)
  if (!hit) {
    res.writeHead(404).end('Not found')
    return
  }
  if ('redirect' in hit) {
    const { search } = new URL(req.url ?? '/', 'http://localhost')
    res.writeHead(301, { location: hit.redirect + search }).end()
    return
  }
  const { body, type } = await readStatic(hit.file)
  // Service workers and manifests must not be cached by the browser.
  const noCache = /(sw\.js|workbox-[^/]*\.js|\.webmanifest|\.html)$/.test(hit.file)
  res.writeHead(hit.status, {
    'content-type': type,
    ...(noCache ? { 'cache-control': 'no-cache' } : {}),
  })
  res.end(body)
}).listen(port, () => console.warn(`preview: http://localhost:${port}/`))
