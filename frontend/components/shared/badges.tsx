import { cn } from '@/lib/utils'
import { daysUntil, splitTags } from '@/lib/item-meta'

/** Neutral tag chip for user-defined tags. */
export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex max-w-40 items-center truncate rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground', className)}>
      #{children}
    </span>
  )
}

export function TagList({ tags, max, className }: { tags: string | null | undefined; max?: number; className?: string }) {
  const list = splitTags(tags)
  if (list.length === 0) return null
  const shown = max ? list.slice(0, max) : list
  const rest = list.length - shown.length
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      {shown.map((t) => <Tag key={t}>{t}</Tag>)}
      {rest > 0 && <span className="text-xs text-muted-foreground">+{rest}</span>}
    </span>
  )
}

/** A small status pill with a leading dot. */
export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: 'danger' | 'warning' | 'success' | 'info' | 'neutral'
  children: React.ReactNode
  className?: string
}) {
  const tones = {
    danger: 'bg-danger-soft text-destructive',
    warning: 'bg-warning-soft text-warning',
    success: 'bg-success-soft text-success',
    info: 'bg-info-soft text-info',
    neutral: 'bg-muted text-muted-foreground',
  }
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold', tones[tone], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  )
}

const ENV_TONES = { prod: 'danger', staging: 'warning', dev: 'info', global: 'neutral' } as const

/** Environment label. `global` is the default and is hidden unless `showGlobal`. */
export function EnvBadge({ env, showGlobal = false }: { env: string | null | undefined; showGlobal?: boolean }) {
  if (!env || (env === 'global' && !showGlobal)) return null
  const tone = ENV_TONES[env as keyof typeof ENV_TONES] ?? 'neutral'
  return <StatusPill tone={tone}>{env}</StatusPill>
}

/** Shows only when the expiry needs attention (past, or within `warnDays`). */
export function ExpiryBadge({ expiresAt, warnDays = 14 }: { expiresAt: string | null | undefined; warnDays?: number }) {
  const days = daysUntil(expiresAt)
  if (days === null || days > warnDays) return null
  if (days < 0) return <StatusPill tone="danger">Expired</StatusPill>
  return <StatusPill tone="warning">{days === 0 ? 'Expires today' : `Expires in ${days}d`}</StatusPill>
}
