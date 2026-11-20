import type { AnchorHTMLAttributes } from 'react'

/**
 * A link into the docs site (`/docs/`). Always opens in a new tab: a game in progress
 * stays where it is, and an installed app does not navigate its own window to the docs —
 * the docs are not part of any app (outside a tool's scope the browser takes over; home's
 * scope `/` covers `/docs/`, so leaving its window is up to `_blank`). `target` and `rel`
 * cannot be overridden.
 */
export function DocsLink({
  href,
  children,
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'> & { href: string }) {
  return (
    <a {...rest} href={href} target="_blank" rel="noopener">
      {children}
    </a>
  )
}
