import { Sidebar } from '@/components/layout/sidebar'
import { EmailVerificationBanner } from '@/components/layout/email-verification-banner'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { CommandPaletteProvider } from '@/components/layout/command-palette'
import { Topbar } from '@/components/layout/topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <CommandPaletteProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <div className="flex h-dvh overflow-hidden">
          {/* Sidebar — desktop only; mobile uses the sheet in the topbar */}
          <div className="hidden shrink-0 lg:block">
            <Sidebar />
          </div>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <EmailVerificationBanner />
            <main id="main" className="flex-1 overflow-y-auto overscroll-contain">
              <Topbar />
              {children}
            </main>
          </div>
        </div>
      </CommandPaletteProvider>
    </SidebarProvider>
  )
}
