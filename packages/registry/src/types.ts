import type { AccentName } from '@catppuccin/palette'

/** `rc`: release candidate, feature-complete and being tried out before stable. */
export type ToolStatus = 'stable' | 'rc' | 'beta' | 'coming-soon'

/**
 * `app`: an installable PWA with its own manifest and service worker (the default).
 * `docs`: a plain static site (the VitePress docs) — no manifest, no service worker,
 * and not listed as a tool on home.
 */
export type ToolKind = 'app' | 'docs'

/** One tool (app) of the 阿瓦隆工具集. */
export interface ToolMeta {
  /** Also the app folder name (`apps/<id>`) and storage namespace. */
  id: string
  name: string
  /** Manifest short_name. */
  shortName: string
  description: string
  /** Where the app is served: `/` for home, `/<id>/` for tools. */
  path: `/${string}`
  /** Tabler icon component name, e.g. `IconClipboardList`. */
  icon: string
  /** Catppuccin accent used for the tool's icon and card. */
  accent: AccentName
  status: ToolStatus
  /** Defaults to `app`. */
  kind?: ToolKind
}
