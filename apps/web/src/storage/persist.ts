/** Persistent storage helpers (navigator.storage). All functions are safe where unsupported. */

export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return null
  }
}

export interface StorageInfo {
  usage: number | null
  quota: number | null
  persisted: boolean | null
}

export async function getStorageInfo(): Promise<StorageInfo> {
  try {
    const [estimate, persisted] = await Promise.all([
      navigator.storage?.estimate?.() ?? Promise.resolve(undefined),
      navigator.storage?.persisted?.() ?? Promise.resolve(null),
    ])
    return { usage: estimate?.usage ?? null, quota: estimate?.quota ?? null, persisted }
  } catch {
    return { usage: null, quota: null, persisted: null }
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(1)} GB`
}
