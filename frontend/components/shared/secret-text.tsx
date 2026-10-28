import { cn } from '@/lib/utils'

/**
 * Renders a secret in the mono face. When revealed, digits are tinted
 * indigo and symbols brass so a password can be read aloud or retyped
 * without confusing 0/O or l/1. When hidden, shows a fixed-width mask
 * that does not leak the length beyond 16.
 */
export function SecretText({
  value,
  revealed,
  className,
}: {
  value: string
  revealed: boolean
  className?: string
}) {
  if (!revealed) {
    return (
      <span className={cn('font-mono tracking-[0.2em] text-muted-foreground', className)} aria-label="Hidden">
        {'•'.repeat(Math.min(Math.max(value.length, 8), 16))}
      </span>
    )
  }
  return (
    <span className={cn('font-mono break-all', className)} translate="no">
      {Array.from(value).map((ch, i) =>
        /[0-9]/.test(ch) ? (
          <span key={i} className="text-info">{ch}</span>
        ) : /[^A-Za-z0-9]/.test(ch) ? (
          <span key={i} className="text-brass-foreground">{ch}</span>
        ) : (
          ch
        ),
      )}
    </span>
  )
}
