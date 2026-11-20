declare const __APP_VERSION__: string

/** `<repo version>-<git short rev>` (root package.json), injected at build time. */
export const APP_VERSION: string =
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0-dev'
