import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Page scaffolding shared by every dashboard screen: one container rhythm,
 * one header pattern. Width variants keep reading pages narrow and list
 * pages wide without each page inventing its own padding.
 */
export function PageContainer({
  children,
  className,
  size = 'default',
}: {
  children: React.ReactNode
  className?: string
  size?: 'narrow' | 'default' | 'wide'
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8',
        size === 'narrow' && 'max-w-3xl',
        size === 'default' && 'max-w-5xl',
        size === 'wide' && 'max-w-6xl',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  back,
  leading,
  children,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  /** Back link shown above the title. */
  back?: { href: string; label: string }
  /** Element before the title (e.g. an item tile). */
  leading?: React.ReactNode
  /** Extra content under the description (badges, tags). */
  children?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('mb-6 space-y-3 lg:mb-8', className)}>
      {back && (
        <Link
          href={back.href}
          className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {leading}
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold tracking-[-0.02em] break-words sm:text-[1.75rem] sm:leading-tight">
              {title}
            </h1>
            {description && <p className="text-pretty text-sm text-muted-foreground sm:text-[0.9375rem]">{description}</p>}
            {children}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}

/**
 * A titled surface. Use for grouped content on detail and settings pages.
 * Lists that are the whole page sit in a Panel without a header.
 */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  id?: string
}) {
  return (
    <section id={id} className={cn('rounded-xl border bg-card text-card-foreground', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0 space-y-0.5">
            {title && <h2 className="text-[0.9375rem] font-semibold">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}
