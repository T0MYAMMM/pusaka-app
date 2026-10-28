import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { AuthBrandPanel } from '@/components/features/auth-brand-panel'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <AuthBrandPanel />

      <div className="relative isolate flex min-h-dvh flex-col pt-[max(env(safe-area-inset-top),1rem)] pr-[max(env(safe-area-inset-right),1rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] pl-[max(env(safe-area-inset-left),1rem)] sm:pr-[max(env(safe-area-inset-right),2rem)] sm:pl-[max(env(safe-area-inset-left),2rem)] lg:pt-8">
        <header className="flex items-center justify-between gap-4 lg:justify-end">
          <Link href="/" className="rounded-lg text-foreground lg:hidden" aria-label="Pusaka home">
            <Logo markClassName="size-8" />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to home
          </Link>
        </header>

        <main className="flex flex-1 justify-center pt-10 pb-24 sm:items-center sm:py-14">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        {/* Mobile only: a batik hem along the bottom edge, standing in for the brand panel. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 lg:hidden">
          <div className="kawung kawung-fade-b h-full [--kawung-size:56px]" />
        </div>
      </div>
    </div>
  )
}
