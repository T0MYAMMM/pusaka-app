'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="lg:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
