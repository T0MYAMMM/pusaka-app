import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** An empty screen is an invitation to act: say what goes here and offer the first step. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        compact ? 'gap-2 px-4 py-8' : 'gap-3 rounded-xl border border-dashed px-6 py-14 sm:py-20',
        className,
      )}
    >
      <span
        className={cn(
          'kawung inline-flex items-center justify-center overflow-hidden rounded-xl bg-accent text-primary [--kawung-size:20px]',
          compact ? 'size-10' : 'size-14',
        )}
      >
        <Icon className={compact ? 'size-5' : 'size-6'} aria-hidden="true" />
      </span>
      <div className="max-w-sm space-y-1">
        <p className={cn('font-semibold', compact ? 'text-sm' : 'text-base')}>{title}</p>
        {description && <p className="text-pretty text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
