'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LogoMark } from '@/components/brand/logo'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { useSidebar } from './sidebar-context'
import { getNav, type NavLink } from './nav-config'

interface SidebarProps {
  onNavigate?: () => void
  /** Force the expanded layout (mobile sheet). */
  forceExpanded?: boolean
}

function NavItem({ link, collapsed, onClick }: { link: NavLink; collapsed: boolean; onClick?: () => void }) {
  const pathname = usePathname()
  const { href, label, icon: Icon, exact } = link
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  const item = (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative flex h-10 items-center rounded-lg text-sm font-medium transition-colors',
        'outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        collapsed ? 'justify-center' : 'gap-3 px-3',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
      )}
    >
      {/* Brass rail marks the current page. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-sidebar-primary transition-opacity',
          isActive ? 'opacity-100' : 'opacity-0',
        )}
      />
      <Icon className={cn('size-[1.125rem] shrink-0', isActive && 'text-sidebar-primary')} aria-hidden="true" />
      {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
    </Link>
  )

  if (!collapsed) return item
  return (
    <Tooltip>
      <TooltipTrigger asChild>{item}</TooltipTrigger>
      <TooltipContent side="right" className="font-medium">{label}</TooltipContent>
    </Tooltip>
  )
}

function NavGroup({ label, collapsed, children }: { label: string; collapsed: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      {collapsed ? (
        <div className="mx-3 mb-2 border-t border-sidebar-border" aria-hidden="true" />
      ) : (
        <p className="mb-1.5 px-3 text-xs font-medium text-sidebar-foreground/45">{label}</p>
      )}
      {children}
    </div>
  )
}

export function Sidebar({ onNavigate, forceExpanded = false }: SidebarProps = {}) {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const sidebar = useSidebar()
  const collapsed = forceExpanded ? false : sidebar.collapsed
  const { t } = useT()
  const nav = getNav(t)

  const handleLogout = async () => {
    try {
      await authApi.logout()
      setUser(null)
      router.push('/login')
    } catch {
      toast.error('Sign-out failed. Check your connection and try again.')
    }
  }

  const initials = user
    ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <aside
      aria-label="Main"
      className={cn(
        'kawung kawung-fade-b relative flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out [--kawung-color:rgba(217,174,85,0.09)] [--kawung-size:44px]',
        collapsed ? 'w-[4.5rem]' : 'w-64',
      )}
    >
      {/* Brand + collapse */}
      <div className={cn('flex h-16 shrink-0 items-center', collapsed ? 'justify-center px-2' : 'justify-between pl-5 pr-3')}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn('flex items-center gap-2.5 rounded-lg', collapsed && 'hidden')}
          translate="no"
        >
          <LogoMark className="size-8" />
          <span className="text-[1.0625rem] font-extrabold tracking-[-0.02em] text-white">Pusaka</span>
        </Link>
        {!forceExpanded && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={sidebar.toggle}
                aria-label={collapsed ? t.shell.expand : t.shell.collapse}
                className="inline-flex size-8 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                {collapsed ? <PanelLeftOpen className="size-4" aria-hidden="true" /> : <PanelLeftClose className="size-4" aria-hidden="true" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? t.shell.expand : t.shell.collapse}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pt-2 pb-3">
        <NavGroup label={t.nav.groupVault} collapsed={collapsed}>
          {nav.vault.map((link) => <NavItem key={link.href} link={link} collapsed={collapsed} onClick={onNavigate} />)}
        </NavGroup>
        <NavGroup label={t.nav.groupShared} collapsed={collapsed}>
          {nav.shared.map((link) => <NavItem key={link.href} link={link} collapsed={collapsed} onClick={onNavigate} />)}
        </NavGroup>
        <div className="mt-auto">
          <NavItem link={{ ...nav.settings, href: '/settings/general' }} collapsed={collapsed} onClick={onNavigate} />
        </div>
      </nav>

      {/* Account */}
      <div className={cn('flex shrink-0 items-center gap-2 border-t border-sidebar-border p-3', collapsed && 'flex-col')}>
        <Link
          href="/settings/general"
          onClick={onNavigate}
          aria-label={collapsed ? `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Account' : undefined}
          className={cn(
            'flex min-w-0 items-center gap-3 rounded-lg transition-colors hover:bg-sidebar-accent/60',
            collapsed ? 'p-1' : 'flex-1 px-2 py-1.5',
          )}
        >
          <Avatar className="size-8 shrink-0 ring-2 ring-sidebar-primary/50">
            <AvatarFallback className="bg-sidebar-accent text-xs font-bold text-sidebar-primary">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">{user?.first_name} {user?.last_name}</span>
              <span className="block truncate text-xs text-sidebar-foreground/55">@{user?.username}</span>
            </span>
          )}
        </Link>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleLogout}
              aria-label={t.common.signOut}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{t.common.signOut}</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}
