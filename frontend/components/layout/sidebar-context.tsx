'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useLocalPreference } from '@/lib/local-store'

interface SidebarContextValue {
  collapsed: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextValue>({ collapsed: false, toggle: () => {} })

const isBool = (v: string): v is 'true' | 'false' => v === 'true' || v === 'false'

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useLocalPreference<'true' | 'false'>('sidebar-collapsed', 'false', isBool)
  const collapsed = stored === 'true'
  const toggle = () => setStored(collapsed ? 'false' : 'true')

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
