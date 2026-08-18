'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  LayoutDashboard, KeyRound, FileText, Activity,
  LogOut, Vault, Building2, Settings, FolderArchive,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useSidebar } from './sidebar-context'
import { useT } from '@/lib/i18n'

interface SidebarProps {
  onNavigate?: () => void
}

function NavItem({
  href, label, icon: Icon, exact, collapsed, onClick,
}: {
  href: string; label: string; icon: React.ElementType; exact?: boolean; collapsed: boolean; onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  const linkClass = cn(
    'flex items-center rounded-md py-2 text-sm font-medium transition-colors',
    collapsed ? 'justify-center px-2' : 'gap-3 px-3',
    isActive
      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href} onClick={onClick} className={linkClass}>
            <Icon className="h-4 w-4 shrink-0" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link href={href} onClick={onClick} className={linkClass}>
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const { collapsed, toggle } = useSidebar()
  const { t } = useT()

  const handleLogout = async () => {
    try {
      await authApi.logout()
      setUser(null)
      router.push('/login')
    } catch {
      toast.error('Logout failed')
    }
  }

  const initials = user
    ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
    : '?'

  const NAV = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard, exact: true },
    { href: '/credentials', label: t.nav.credentials, icon: KeyRound },
    { href: '/notes', label: t.nav.notes, icon: FileText },
    { href: '/documents', label: t.nav.documents, icon: FolderArchive },
    { href: '/activity', label: t.nav.activity, icon: Activity },
  ]

  const TEAM_NAV = [
    { href: '/vaults', label: t.nav.vaults, icon: Vault },
    { href: '/settings/organization', label: t.nav.organizations, icon: Building2 },
  ]

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-sidebar transition-all duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand + toggle */}
      <div className={cn('flex items-center py-4', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-serif font-bold text-xl tracking-wide text-sidebar-primary leading-none">
              PUSAKA
            </span>
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              onClick={toggle}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </TooltipContent>
        </Tooltip>
      </div>

      <Separator className="opacity-20" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV.map(({ href, label, icon, exact }) => (
          <NavItem key={href} href={href} label={label} icon={icon} exact={exact} collapsed={collapsed} onClick={onNavigate} />
        ))}

        {!collapsed && (
          <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Team
          </p>
        )}
        {collapsed && <div className="mt-3 mb-1 mx-2 border-t border-sidebar-border" />}

        {TEAM_NAV.map(({ href, label, icon }) => (
          <NavItem key={href} href={href} label={label} icon={icon} collapsed={collapsed} onClick={onNavigate} />
        ))}

        <div className="flex-1" />

        <NavItem href="/settings/general" label={t.nav.settings} icon={Settings} collapsed={collapsed} onClick={onNavigate} />
      </nav>

      <Separator className="opacity-20" />

      {/* User row */}
      <div className={cn('flex items-center gap-2 p-3', collapsed ? 'flex-col' : 'flex-row')}>
        {collapsed ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/settings/general" onClick={onNavigate}>
                  <Avatar className="h-8 w-8 shrink-0 cursor-pointer ring-2 ring-sidebar-primary/30 hover:ring-sidebar-primary/70 transition-all">
                    <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-foreground">{initials}</AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                {user?.first_name} {user?.last_name}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <Link
              href="/settings/general"
              onClick={onNavigate}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent/60"
            >
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-primary/30">
                <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/50">@{user?.username}</p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Sign out"
              className="shrink-0 h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </aside>
  )
}
