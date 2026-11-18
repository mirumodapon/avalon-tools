import { describe, expect, it } from 'vitest'
import { cleanupScript } from './cleanup.ts'

const ORIGIN = 'https://avalon.example'

/** Runs the generated script in a fake worker and fires `activate`. */
async function activate(cacheId: string, scope: string, names: string[]) {
  const store = new Set(names)
  let handler: ((e: { waitUntil: (p: Promise<unknown>) => void }) => void) | undefined
  const self = {
    registration: { scope },
    addEventListener: (_: string, h: typeof handler) => (handler = h),
  }
  const caches = {
    keys: () => Promise.resolve([...store]),
    delete: (n: string) => Promise.resolve(store.delete(n)),
  }
  new Function('self', 'caches', cleanupScript(cacheId))(self, caches)
  let done: Promise<unknown> = Promise.resolve()
  handler!({ waitUntil: (p) => (done = p) })
  await done
  return [...store].toSorted()
}

const v1 = `workbox-precache-v2-${ORIGIN}/`
const home = `avalon-home-precache-v2-${ORIGIN}/`
const record = `avalon-record-precache-v2-${ORIGIN}/record/`
const homeTemp = `${home}-temp`

describe('service worker cache cleanup', () => {
  it('home removes the 1.x precache but keeps its own and record’s', async () => {
    expect(await activate('avalon-home', `${ORIGIN}/`, [v1, home, record, homeTemp])).toEqual(
      [home, homeTemp, record].toSorted(),
    )
  })

  it('record never touches caches outside /record/', async () => {
    const old = `workbox-precache-v2-${ORIGIN}/record/`
    expect(await activate('avalon-record', `${ORIGIN}/record/`, [v1, home, record, old])).toEqual(
      [v1, home, record].toSorted(),
    )
  })

  it('leaves non-precache caches alone', async () => {
    expect(await activate('avalon-home', `${ORIGIN}/`, ['my-runtime', home])).toEqual([
      home,
      'my-runtime',
    ])
  })
})
