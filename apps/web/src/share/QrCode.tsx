import { useEffect, useState } from 'react'

const QUIET = 2

/**
 * QR code drawn as SVG paths. Always uses the light (Latte) palette so modules are
 * dark on light, which every scanner reads; colors come from theme tokens.
 */
export function QrCode({ value, label }: { value: string; label: string }) {
  const [path, setPath] = useState<{ d: string; size: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    import('qrcode')
      .then(({ default: QRCode }) => {
        const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' })
        let d = ''
        for (let y = 0; y < modules.size; y++) {
          for (let x = 0; x < modules.size; x++) {
            if (modules.get(x, y)) d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`
          }
        }
        if (alive) setPath({ d, size: modules.size + QUIET * 2 })
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [value])

  if (error) return <p className="text-sm text-fail-fg">無法產生 QR code：{error}</p>
  return (
    <div data-flavor="latte" className="mx-auto w-full max-w-64 rounded-2xl bg-base p-2 text-text">
      {path ? (
        <svg
          role="img"
          aria-label={label}
          viewBox={`0 0 ${path.size} ${path.size}`}
          shapeRendering="crispEdges"
          className="block aspect-square w-full"
        >
          <path d={path.d} fill="currentColor" />
        </svg>
      ) : (
        <div className="aspect-square w-full animate-pulse rounded-xl bg-surface0" />
      )}
    </div>
  )
}
