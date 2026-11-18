/**
 * 1.x lived at `/` with hash routes; links and bookmarks still point there.
 * Maps them to the record tool, keeping the hash route and share parameter.
 */
const RECORD = '/record/'

/** 1.x hash routes (`#/` itself is home's tool list now). */
const V1_ROUTES = /^#\/(new|play|summary|game|settings)(\/|$)/

const HOME_DOCS = new Set(['/', '/index.html'])

export function legacyRedirect(url: {
  pathname: string
  search: string
  hash: string
}): string | null {
  if (!HOME_DOCS.has(url.pathname)) return null
  const share = new URLSearchParams(url.search).has('s')
  if (!share && !V1_ROUTES.test(url.hash)) return null
  return `${RECORD}${url.search}${url.hash}`
}
