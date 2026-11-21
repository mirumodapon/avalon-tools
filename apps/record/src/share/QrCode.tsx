import { useEffect, useState } from 'react'

/**
 * QR code drawn as SVG paths (encoded with uqr, loaded on first use). Always uses the light
 * (Latte) palette so modules are dark on light, which every scanner reads; colors come from
 * theme tokens.
 */
export function QrCode({ value, label }: { value: string; label: string }) {
  const [path, setPath] = useState<{ d: string; size: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    import('./qrSvg.ts')
      .then(({ qrModules, qrPath }) => alive && setPath(qrPath(qrModules(value))))
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
