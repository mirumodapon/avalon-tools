/** Cache the 1.x service worker filled at `/` (Workbox default prefix). */
export function legacyCacheName(origin: string): string {
  return `workbox-precache-v2-${origin}/`
}

/**
 * Deletes the 1.x precache from the page as well, in case the new worker has not
 * activated yet (the worker's own cleanup does the same on activate).
 */
export async function clearLegacyCaches(
  cacheStorage: CacheStorage | undefined = globalThis.caches,
): Promise<boolean> {
  if (!cacheStorage) return false
  try {
    return await cacheStorage.delete(legacyCacheName(window.location.origin))
  } catch {
    return false
  }
}
