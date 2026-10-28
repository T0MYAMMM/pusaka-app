import Link from 'next/link'
import { AlertCircle, Loader2, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Page heading for an auth form. */
export function AuthHeader({ title, description }: { title: string; description?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-pretty text-muted-foreground">{description}</p>}
    </div>
  )
}

/** Small link beneath an auth form ("No account? Create one"). */
export function AuthFooter({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-sm text-muted-foreground">{children}</p>
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-primary underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}

/** Full-width primary submit with an inline spinner while the request runs. */
export function AuthSubmit({
  pending,
  children,
  pendingLabel,
}: {
  pending: boolean
  children: React.ReactNode
  pendingLabel: string
}) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending || undefined}>
      {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {pending ? pendingLabel : children}
    </Button>
  )
}

/** Form-level error from the server, announced when it appears. */
export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="flex gap-3 rounded-lg bg-danger-soft p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="space-y-0.5 [&_a]:text-current [&_a]:underline">{children}</div>
    </div>
  )
}

/** Spinner + message while a page is working. */
export function AuthLoading({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="mt-[10vh] flex flex-col items-center gap-4 py-8 text-center sm:mt-0">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
        <Loader2 className="size-6 animate-spin" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-muted-foreground">{children}</p>
    </div>
  )
}

const TONES = {
  success: 'bg-success-soft text-success',
  error: 'bg-danger-soft text-destructive',
  pending: 'bg-warning-soft text-warning',
} as const

/** Centred outcome block for status pages: icon tile, heading, message, action. */
export function AuthResult({
  tone,
  icon: Icon,
  title,
  children,
  action,
  secondary,
}: {
  tone: keyof typeof TONES
  icon: LucideIcon
  title: string
  children?: React.ReactNode
  action: { href: string; label: string }
  secondary?: React.ReactNode
}) {
  return (
    <div className="mt-[10vh] flex flex-col items-center text-center sm:mt-0">
      <span className={cn('flex size-14 items-center justify-center rounded-2xl', TONES[tone])}>
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">{title}</h1>
      {children && <div className="mt-2 text-sm text-pretty text-muted-foreground">{children}</div>}
      <Button asChild size="lg" className="mt-8 w-full">
        <Link href={action.href}>{action.label}</Link>
      </Button>
      {secondary && <div className="mt-4 text-sm text-muted-foreground">{secondary}</div>}
    </div>
  )
}
