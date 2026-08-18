import { Badge } from '@/components/ui/badge'
import {
  Globe, Mail, Twitter, Landmark, Briefcase,
  User, Server, Key, Folder,
} from 'lucide-react'

const TYPE_META: Record<string, { label: string; icon: React.ElementType }> = {
  website:  { label: 'Website',  icon: Globe },
  email:    { label: 'Email',    icon: Mail },
  social:   { label: 'Social',   icon: Twitter },
  banking:  { label: 'Banking',  icon: Landmark },
  work:     { label: 'Work',     icon: Briefcase },
  personal: { label: 'Personal', icon: User },
  server:   { label: 'Server',   icon: Server },
  api:      { label: 'API Key',  icon: Key },
  other:    { label: 'Other',    icon: Folder },
}

export function CredentialTypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type] ?? TYPE_META.other
  const Icon = meta.icon
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  )
}

export function credentialTypeIcon(type: string): React.ElementType {
  return (TYPE_META[type] ?? TYPE_META.other).icon
}
