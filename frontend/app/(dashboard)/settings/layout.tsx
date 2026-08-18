'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User, Lock, Shield, Eye, CreditCard, Building2 } from 'lucide-react'

const SETTINGS_NAV = [
  { href: '/settings/general', label: 'General', icon: User },
  { href: '/settings/account', label: 'Account', icon: Lock },
  { href: '/settings/security', label: 'Security', icon: Shield },
  { href: '/settings/privacy', label: 'Privacy', icon: Eye },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings/organization', label: 'Organization', icon: Building2 },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-full">
      {/* Mobile horizontal nav */}
      <div className="flex gap-1 overflow-x-auto border-b px-4 py-2 lg:hidden">
        {SETTINGS_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        ))}
      </div>

      {/* Desktop: side-by-side layout */}
      <div className="mx-auto flex max-w-5xl gap-8 p-4 sm:p-6">
        {/* Left nav — desktop */}
        <aside className="hidden lg:block w-44 shrink-0">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings</p>
          <nav className="flex flex-col gap-0.5">
            {SETTINGS_NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
