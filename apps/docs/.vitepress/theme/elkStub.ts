/**
 * Stands in for `elkjs` (EPL-2.0 / GPL-3.0), which mermaid pulls in for its optional
 * `layout: elk`. The docs never use that layout, so the library is left out of the build
 * instead of being shipped; a diagram asking for it fails with this message.
 */
export default class ElkUnavailable {
  layout(): Promise<never> {
    return Promise.reject(new Error('使用說明未包含 ELK 版面，請改用預設的 mermaid 版面'))
  }
}
