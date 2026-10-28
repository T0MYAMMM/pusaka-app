'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useT } from '@/lib/i18n'
import { Sidebar } from './sidebar'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { t } = useT()

  return (
    <>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} className="size-9 lg:hidden" aria-label={t.shell.openMenu}>
        <Menu className="size-5" aria-hidden="true" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 border-0 bg-sidebar p-0 [&>button]:text-sidebar-foreground">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setOpen(false)} forceExpanded />
        </SheetContent>
      </Sheet>
    </>
  )
}
