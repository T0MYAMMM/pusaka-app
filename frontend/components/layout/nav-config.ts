import {
  LayoutDashboard, KeyRound, StickyNote, FolderArchive, History,
  Vault, Building2, Settings, Plus, FileUp, NotebookPen,
  type LucideIcon,
} from 'lucide-react'
import type { Translations } from '@/lib/i18n'

export interface NavLink {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

/** One source of truth for navigation, shared by the sidebar and ⌘K. */
export function getNav(t: Translations) {
  const vault: NavLink[] = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard, exact: true },
    { href: '/credentials', label: t.nav.credentials, icon: KeyRound },
    { href: '/notes', label: t.nav.notes, icon: StickyNote },
    { href: '/documents', label: t.nav.documents, icon: FolderArchive },
    { href: '/activity', label: t.nav.activity, icon: History },
  ]
  const shared: NavLink[] = [
    { href: '/vaults', label: t.nav.vaults, icon: Vault },
    { href: '/settings/organization', label: t.nav.organizations, icon: Building2 },
  ]
  const settings: NavLink = { href: '/settings/general', label: t.nav.settings, icon: Settings }
  const create: NavLink[] = [
    { href: '/credentials/new', label: t.nav.newCredential, icon: Plus },
    { href: '/notes/new', label: t.nav.newNote, icon: NotebookPen },
    { href: '/documents/new', label: t.nav.newDocument, icon: FileUp },
  ]
  return { vault, shared, settings, create }
}
