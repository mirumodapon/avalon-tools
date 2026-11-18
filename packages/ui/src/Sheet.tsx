import { IconX } from '@tabler/icons-react'
import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from './ui.tsx'

/**
 * Bottom sheet modal, thumb-friendly on phones. Rendered into <body> via a portal:
 * ancestors with backdrop-filter (e.g. the sticky header) would otherwise become the
 * containing block for `position: fixed` and clip the sheet.
 */
export function Sheet({
  title,
  open,
  onClose,
  children,
  footer,
}: {
  title: ReactNode
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const id = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="關閉"
        className="absolute inset-0 bg-crust/70"
        onClick={onClose}
        tabIndex={-1}
      />
      <dialog
        open
        aria-modal="true"
        aria-labelledby={id}
        className="relative m-0 flex text-text max-h-[90dvh] w-full max-w-xl flex-col rounded-t-3xl bg-base shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-center gap-2 border-b border-surface0 px-4 py-2">
          <h2 id={id} className="flex-1 text-lg font-bold">
            {title}
          </h2>
          <IconButton label="關閉" onClick={onClose}>
            <IconX size={22} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && (
          <div className="border-t border-surface0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </dialog>
    </div>,
    document.body,
  )
}

export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: ReactNode
  message: ReactNode
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Sheet
      title={title}
      open={open}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-surface0"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className={
              danger
                ? 'min-h-11 flex-1 rounded-xl bg-fail font-semibold text-on-fill'
                : 'min-h-11 flex-1 rounded-xl bg-accent font-semibold text-on-accent'
            }
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="text-subtext1">{message}</div>
    </Sheet>
  )
}
