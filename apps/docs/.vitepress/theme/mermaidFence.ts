import type { MarkdownRenderer } from 'vitepress'

/** Turns ```mermaid fences into the client-only <Mermaid> component. */
export function mermaidFence(md: MarkdownRenderer): void {
  const fence = md.renderer.rules.fence!
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!
    if (token.info.trim() !== 'mermaid') return fence(tokens, idx, options, env, self)
    return `<Mermaid code="${encodeURIComponent(token.content)}" />`
  }
}
