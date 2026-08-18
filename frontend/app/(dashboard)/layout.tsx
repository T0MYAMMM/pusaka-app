import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { EmailVerificationBanner } from '@/components/layout/email-verification-banner'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { Topbar } from '@/components/layout/topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar — desktop only */}
        <div className="hidden shrink-0 lg:block">
          <Sidebar />
        </div>

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <EmailVerificationBanner />

          {/* Mobile header */}
          <header className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:hidden">
            <MobileNav />
            <span className="font-serif font-bold text-lg tracking-wide text-primary">PUSAKA</span>
          </header>

          {/* Topbar — language + theme, always visible */}
          <Topbar />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        <KeyboardShortcuts />
      </div>
    </SidebarProvider>
  )
}
