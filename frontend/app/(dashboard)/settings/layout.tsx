'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Lock, Shield, Eye, CreditCard, Building2 } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/shared/page'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = useT()
  const pillsRef = useRef<HTMLUListElement>(null)

  // Bring the current page's pill into view in the scrolling mobile row.
  useEffect(() => {
    const active = pillsRef.current?.querySelector<HTMLElement>('[aria-current="page"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [pathname])

  const nav = [
    { href: '/settings/general', label: t.settings.general, icon: User },
    { href: '/settings/account', label: t.settings.account, icon: Lock },
    { href: '/settings/security', label: t.settings.security, icon: Shield },
    { href: '/settings/privacy', label: t.settings.privacy, icon: Eye },
    { href: '/settings/billing', label: t.settings.billing, icon: CreditCard },
    { href: '/settings/organization', label: t.settings.organization, icon: Building2 },
  ]

  return (
    <PageContainer>
      <PageHeader title={t.settings.title} description="Your profile, sign-in, API keys, plan and organizations." />

      <div className="lg:grid lg:grid-cols-[13rem_1fr] lg:items-start lg:gap-8">
        {/* Mobile: a horizontally scrolling row of pills */}
        <nav aria-label={t.settings.title} className="mb-5 lg:hidden">
          <ul ref={pillsRef} className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <li key={href} className="shrink-0">
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[0.8125rem] font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-input hover:text-foreground',
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Desktop: left rail */}
        <nav aria-label={t.settings.title} className="sticky top-22 hidden lg:block">
          <ul className="space-y-0.5">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-9 items-center gap-2.5 rounded-lg border px-3 text-sm font-medium transition-colors',
                      active
                        ? 'border-border bg-card text-foreground shadow-xs'
                        : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon className={cn('size-4 shrink-0', active && 'text-primary')} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </PageContainer>
  )
}
