/** Download / clipboard / Web Share helpers. Each returns false when unsupported or cancelled. */

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export async function copyImage(blob: Blob): Promise<boolean> {
  try {
    if (typeof ClipboardItem === 'undefined') return false
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    return true
  } catch {
    return false
  }
}

export function canShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

/** Shares as a file when supported, otherwise as text (when given). */
export async function shareFile(file: File, text?: string): Promise<boolean> {
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: file.name })
      return true
    }
    if (text !== undefined) {
      await navigator.share({ title: file.name, text })
      return true
    }
    return false
  } catch {
    return false
  }
}
