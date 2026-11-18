/**
 * Runs every app's Vite dev server behind one same-origin proxy, so links between
 * tools and the shared localStorage behave as in production.
 *
 *   node scripts/dev.ts [--filter <id>]... [--port 5173]
 *
 * Each app keeps its own base (home `/`, record `/record/`); the proxy routes by the
 * longest registry path prefix, including Vite's HMR websocket.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { createServer, request } from 'node:http'
import { connect } from 'node:net'
import type { ToolMeta } from '../packages/registry/src/index.ts'
import { appForPath, apps, packageName, root } from './lib/apps.ts'

function args(flag: string): string[] {
  return process.argv.flatMap((a, i) =>
    a === flag && process.argv[i + 1] ? [process.argv[i + 1]!] : [],
  )
}

const port = Number(args('--port')[0] ?? 5173)
const list = apps(args('--filter'))
if (!list.length) {
  console.error('no apps match --filter')
  process.exit(1)
}

const ports = new Map<ToolMeta, number>(list.map((t, i) => [t, port + 1 + i]))
const children: ChildProcess[] = []

for (const [tool, p] of ports) {
  const child = spawn(
    'pnpm',
    [
      '--filter',
      packageName(tool),
      'exec',
      'vite',
      '--port',
      String(p),
      '--strictPort',
      '--clearScreen',
      'false',
    ],
    // Own process group, so stopping kills pnpm and the vite it started.
    { cwd: root, stdio: ['ignore', 'inherit', 'inherit'], detached: true },
  )
  children.push(child)
  child.on('exit', (code) => {
    if (code) console.error(`${tool.id} dev server exited with ${code}`)
  })
}

function targetPort(url: string | undefined): number | undefined {
  const tool = appForPath(list, new URL(url ?? '/', 'http://localhost').pathname)
  return tool && ports.get(tool)
}

const server = createServer((req, res) => {
  const p = targetPort(req.url)
  if (!p) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end(`沒有啟動這個路徑的 app（--filter ${list.map((t) => t.id).join(', ')}）`)
    return
  }
  const upstream = request(
    { host: 'localhost', port: p, path: req.url, method: req.method, headers: req.headers },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers)
      up.pipe(res)
    },
  )
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('dev server 尚未就緒，稍後重新整理')
  })
  req.pipe(upstream)
})

// HMR websockets: pipe the raw upgrade to the matching dev server.
server.on('upgrade', (req, socket, head) => {
  const p = targetPort(req.url)
  if (!p) return socket.destroy()
  const up = connect(p, 'localhost', () => {
    const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`]
    for (let i = 0; i < req.rawHeaders.length; i += 2)
      lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`)
    up.write(`${lines.join('\r\n')}\r\n\r\n`)
    up.write(head)
    socket.pipe(up).pipe(socket)
  })
  up.on('error', () => socket.destroy())
  socket.on('error', () => up.destroy())
})

server.listen(port, () => {
  console.warn(`\n  阿瓦隆工具集 dev: http://localhost:${port}/`)
  for (const t of list) console.warn(`    ${t.path.padEnd(12)} → ${t.id} (:${ports.get(t)})`)
})

function stop() {
  for (const c of children) {
    try {
      if (c.pid) process.kill(-c.pid, 'SIGTERM')
    } catch {
      // already gone
    }
  }
  server.close()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
