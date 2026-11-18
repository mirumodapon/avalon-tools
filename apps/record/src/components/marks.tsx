import type { Vote } from '@avalon/core'
import {
  IconAlertTriangle,
  IconCheck,
  IconCrown,
  IconFlag,
  IconThumbDown,
  IconThumbUp,
  IconX,
} from '@tabler/icons-react'
import { cx } from './ui.tsx'

/** Approve / reject, shown with icon + text so color is never the only signal. */
export function VoteMark({
  vote,
  showLabel = false,
  size = 16,
}: {
  vote: Vote
  showLabel?: boolean
  size?: number
}) {
  const approve = vote === 'approve'
  return (
    <span
      className={cx(
        'inline-flex items-center gap-0.5',
        approve ? 'text-approve-fg' : 'text-reject-fg',
      )}
      title={approve ? '贊成' : '反對'}
    >
      {approve ? (
        <IconCheck size={size} stroke={3} aria-hidden />
      ) : (
        <IconX size={size} aria-hidden />
      )}
      <span className={showLabel ? '' : 'sr-only'}>{approve ? '贊成' : '反對'}</span>
    </span>
  )
}

export type AnomalyKind = 'outside-approve' | 'inside-reject'

export const ANOMALY_LABEL: Record<AnomalyKind, string> = {
  'outside-approve': '場外白',
  'inside-reject': '場內黑',
}

export function AnomalyMark({
  kind,
  showLabel = false,
  size = 16,
}: {
  kind: AnomalyKind
  showLabel?: boolean
  size?: number
}) {
  const outside = kind === 'outside-approve'
  return (
    <span
      className={cx(
        'inline-flex items-center gap-0.5',
        outside ? 'text-outside-approve-fg' : 'text-inside-reject-fg',
      )}
      title={ANOMALY_LABEL[kind]}
    >
      {outside ? (
        <IconThumbUp size={size} aria-hidden />
      ) : (
        <IconThumbDown size={size} aria-hidden />
      )}
      <span className={showLabel ? '' : 'sr-only'}>{ANOMALY_LABEL[kind]}</span>
    </span>
  )
}

export function CrownMark({ size = 16, label = '隊長' }: { size?: number; label?: string }) {
  return (
    <span className="inline-flex text-crown-fg" title={label}>
      <IconCrown size={size} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function TeamMark({ size = 16 }: { size?: number }) {
  return (
    <span className="inline-flex text-accent-fg" title="隊員">
      <IconFlag size={size} aria-hidden />
      <span className="sr-only">隊員</span>
    </span>
  )
}

export function ForcedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border border-forced px-2 py-0.5 text-xs font-semibold text-forced-fg',
        className,
      )}
    >
      <IconAlertTriangle size={14} aria-hidden />
      強制局
    </span>
  )
}
