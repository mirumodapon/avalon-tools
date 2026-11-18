import { Fragment, type ReactNode } from 'react'

/** Inline `code` spans; everything else is plain text. */
function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={i} className="rounded bg-surface0 px-1 font-mono text-xs">
        {part.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

/**
 * Renders the subset of Markdown CHANGELOG.md uses: `##`/`###` headings, `-` bullets
 * (with indentation) and paragraphs. The top-level `#` title is dropped.
 */
export function Changelog({ source }: { source: string }) {
  const blocks: ReactNode[] = []
  let items: { depth: number; text: string }[] = []
  const flush = () => {
    if (!items.length) return
    blocks.push(
      <ul key={blocks.length} className="mb-2 space-y-0.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-1.5" style={{ paddingLeft: `${it.depth * 1}rem` }}>
            <span aria-hidden className="text-overlay1">
              •
            </span>
            <span>{inline(it.text)}</span>
          </li>
        ))}
      </ul>,
    )
    items = []
  }
  for (const line of source.split('\n')) {
    const bullet = /^(\s*)- (.*)$/.exec(line)
    if (bullet) {
      items.push({ depth: Math.floor(bullet[1]!.length / 2), text: bullet[2]! })
      continue
    }
    flush()
    if (line.startsWith('# ') || !line.trim()) continue
    const heading = /^(#{2,3}) (.*)$/.exec(line)
    if (heading) {
      blocks.push(
        heading[1] === '##' ? (
          <h3 key={blocks.length} className="mt-3 mb-1 font-semibold text-text first:mt-0">
            {inline(heading[2]!)}
          </h3>
        ) : (
          <h4 key={blocks.length} className="mt-2 mb-1 text-sm font-semibold text-subtext0">
            {inline(heading[2]!)}
          </h4>
        ),
      )
    } else {
      blocks.push(
        <p key={blocks.length} className="mb-2">
          {inline(line)}
        </p>,
      )
    }
  }
  flush()
  return <div className="max-h-96 overflow-y-auto text-sm text-subtext1">{blocks}</div>
}
