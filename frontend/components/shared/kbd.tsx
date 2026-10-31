import { cn } from '@/lib/utils'

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-b-2 bg-muted px-1 font-sans text-[0.6875rem] font-semibold text-muted-foreground',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

/** A definition list for item metadata (created, updated, type…). */
export function MetaList({ items, className }: { items: { label: string; value: React.ReactNode }[]; className?: string }) {
  return (
    <dl className={cn('space-y-3 text-sm', className)}>
      {items.map(({ label, value }) => (
        <div key={label} className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 text-right font-medium break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
