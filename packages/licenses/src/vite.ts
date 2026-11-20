import type { Plugin } from 'vite'
import { packageOf, readPackage, renderNotices, type PackageNotice } from './licenses.ts'

/** Served next to each app's index.html. */
export const LICENSES_FILE = 'licenses.txt'

/**
 * Emits {@link LICENSES_FILE} with the licenses of every npm package in the client
 * bundle, and fails the build when one is not on the allowlist (see ALLOWED_LICENSES).
 */
export function thirdPartyLicensesPlugin(title: string): Plugin {
  return {
    name: 'avalon-third-party-licenses',
    apply: 'build',
    // Only what reaches the browser: not VitePress's server (SSR) build.
    applyToEnvironment: (env) => env.config.consumer === 'client',
    generateBundle(_options, bundle) {
      const dirs = new Map<string, string>()
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue
        for (const id of output.moduleIds) {
          const pkg = packageOf(id)
          if (pkg) dirs.set(pkg.dir, pkg.name)
        }
      }
      const byName = new Map<string, PackageNotice>()
      for (const dir of dirs.keys()) {
        const notice = readPackage(dir)
        // The same version can sit in several folders (peer-dependency variants).
        byName.set(`${notice.name}@${notice.version}`, notice)
      }
      const packages = [...byName.values()]
      const refused = packages.filter((p) => !p.license)
      if (refused.length) {
        this.error(
          `Bundled packages with licenses that are not allowed: ${refused
            .map((p) => `${p.name}@${p.version} (${p.declared})`)
            .join(', ')}. Remove them, or review the license and extend ALLOWED_LICENSES.`,
        )
      }
      this.emitFile({
        type: 'asset',
        fileName: LICENSES_FILE,
        source: renderNotices(title, packages),
      })
    },
  }
}
