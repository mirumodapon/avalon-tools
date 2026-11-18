import { IconCrown, IconLoader2 } from '@tabler/icons-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

type Phase = 'checking' | 'done'

/** Longest we block startup waiting for the update check (e.g. on a slow network). */
export const CHECK_TIMEOUT_MS = 6000
/** Re-check when coming back after the app sat in the background this long. */
export const RESUME_CHECK_MS = 5 * 60 * 1000
/** If the new version has not taken over by then, reload anyway. */
const UPDATE_RELOAD_MS = 10000

function canCheck(enabled: boolean): boolean {
  return (
    enabled &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    navigator.onLine !== false
  )
}

/**
 * Checks for a new version every time the app is opened (and when it returns from a
 * long stay in the background). A found update is applied immediately, so each
 * session runs the latest version. Offline or slow checks never block the app.
 */
export function UpdateGate({
  children,
  enabled = !import.meta.env.DEV,
}: {
  children: ReactNode
  /** Off in the dev server, where no service worker is registered. */
  enabled?: boolean
}) {
  const [phase, setPhase] = useState<Phase>(() => (canCheck(enabled) ? 'checking' : 'done'))
  const registration = useRef<ServiceWorkerRegistration | undefined>(undefined)
  const finish = useCallback(() => setPhase((p) => (p === 'checking' ? 'done' : p)), [])

  const check = useCallback(
    async (r: ServiceWorkerRegistration | undefined) => {
      if (!r) return finish()
      if (r.waiting) return // onNeedRefresh takes it from here
      try {
        await r.update()
      } catch {
        return finish()
      }
      const incoming = r.installing ?? r.waiting
      if (!incoming) return finish()
      // Once installed, vite-plugin-pwa reports needRefresh; a failed install just ends the check.
      incoming.addEventListener('statechange', () => {
        if (incoming.state === 'redundant') finish()
      })
    },
    [finish],
  )

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_url, r) {
      registration.current = r
      if (canCheck(enabled)) void check(r)
      else finish()
    },
    onRegisterError: finish,
  })

  // Apply a found update right away (once), then reload into it.
  const applying = useRef(false)
  useEffect(() => {
    if (!needRefresh || applying.current) return
    applying.current = true
    void updateServiceWorker(true)
    setTimeout(() => window.location.reload(), UPDATE_RELOAD_MS)
  }, [needRefresh, updateServiceWorker])
  const updating = needRefresh

  // Never block for long: slow or offline checks give up.
  useEffect(() => {
    if (phase !== 'checking') return
    const t = setTimeout(finish, CHECK_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [phase, finish])

  // Check again when the app comes back after a long time in the background.
  useEffect(() => {
    let hiddenAt = 0
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (hiddenAt && Date.now() - hiddenAt >= RESUME_CHECK_MS && canCheck(enabled)) {
        setPhase('checking')
        void check(registration.current)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [check, enabled])

  return (
    <>
      {children}
      {(updating || phase !== 'done') && (
        <output
          aria-live="polite"
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-base text-text"
        >
          <IconCrown size={56} className="text-crown-fg" aria-hidden />
          <span className="flex items-center gap-2 text-lg font-semibold">
            <IconLoader2 size={22} className="animate-spin text-accent-fg" aria-hidden />
            {updating ? 'APP 更新中…' : '檢查更新中…'}
          </span>
        </output>
      )}
    </>
  )
}
