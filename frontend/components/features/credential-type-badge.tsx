import { cn } from '@/lib/utils'
import { TONES, credentialMeta, type ItemMeta } from '@/lib/item-meta'

/** Category label with its icon, tinted with the category tone. */
export function TypeBadge({ meta, label, className }: { meta: ItemMeta; label?: string; className?: string }) {
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold', TONES[meta.tone], className)}>
      <Icon className="size-3" aria-hidden="true" />
      {label ?? meta.label}
    </span>
  )
}

export function CredentialTypeBadge({ type, className }: { type: string; className?: string }) {
  return <TypeBadge meta={credentialMeta(type)} className={className} />
}

export function credentialTypeIcon(type: string): React.ElementType {
  return credentialMeta(type).icon
}
