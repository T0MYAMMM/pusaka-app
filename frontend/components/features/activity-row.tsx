'use client'

import {
  Activity, Download, FolderArchive, KeyRound, LogIn, LogOut, StickyNote, UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ItemTile } from '@/components/shared/item-tile'
import type { ActivityItem } from '@/lib/api'
import type { Tone } from '@/lib/item-meta'
import { formatDate, formatDistanceToNow } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const VERBS: Record<string, { label: string; tone: Tone }> = {
  create: { label: 'Created', tone: 'jade' },
  update: { label: 'Updated', tone: 'sky' },
  delete: { label: 'Deleted', tone: 'rose' },
  view: { label: 'Viewed', tone: 'slate' },
  download: { label: 'Downloaded', tone: 'slate' },
}

const OBJECTS: Record<string, { label: string; icon: LucideIcon }> = {
  credential: { label: 'credential', icon: KeyRound },
  note: { label: 'note', icon: StickyNote },
  document: { label: 'document', icon: FolderArchive },
}

const SPECIAL: Record<string, { label: string; icon: LucideIcon; tone: Tone }> = {
  login: { label: 'Signed in', icon: LogIn, tone: 'slate' },
  logout: { label: 'Signed out', icon: LogOut, tone: 'slate' },
  register: { label: 'Account created', icon: UserPlus, tone: 'indigo' },
  export_data: { label: 'Exported data', icon: Download, tone: 'amber' },
}

/** Label, icon and tone for an activity action such as `update_credential`. */
export function activityMeta(action: string): { label: string; icon: LucideIcon; tone: Tone; kind: 'special' | 'item' | 'other' } {
  if (SPECIAL[action]) return { ...SPECIAL[action], kind: 'special' }
  const [verb, object] = action.split('_')
  const v = VERBS[verb]
  const o = OBJECTS[object]
  if (v && o) return { label: `${v.label} ${o.label}`, icon: o.icon, tone: v.tone, kind: 'item' }
  return { label: action.replace(/_/g, ' '), icon: Activity, tone: 'slate', kind: 'other' }
}

/**
 * The backend writes descriptions like "Viewed note: Wi-Fi". Show the item
 * name as the title and the action underneath, so neither repeats.
 */
function rowText(item: ActivityItem, meta: ReturnType<typeof activityMeta>) {
  const sep = item.description.indexOf(': ')
  if (meta.kind === 'item' && sep > -1) return { title: item.description.slice(sep + 2), sub: meta.label }
  if (meta.kind === 'special' && item.action !== 'export_data') return { title: meta.label, sub: null }
  return { title: item.description, sub: meta.kind === 'other' ? null : meta.label }
}

export function ActivityRow({ item }: { item: ActivityItem }) {
  const { lang } = useT()
  const meta = activityMeta(item.action)
  const { title, sub } = rowText(item, meta)
  const full = formatDate(item.timestamp, lang, { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
      <ItemTile icon={meta.icon} tone={meta.tone} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={item.description}>{title}</p>
        {(sub || item.ip_address) && (
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            {sub && <span className="shrink-0">{sub}</span>}
            {sub && item.ip_address && <span aria-hidden="true">·</span>}
            {item.ip_address && <span className="truncate font-mono" translate="no">{item.ip_address}</span>}
          </p>
        )}
      </div>
      <time dateTime={item.timestamp} title={full} className="shrink-0 text-right text-xs text-muted-foreground tabular">
        {formatDistanceToNow(item.timestamp, lang)}
      </time>
    </li>
  )
}

export function ActivityRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="divide-y" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-3 w-14" />
        </li>
      ))}
    </ul>
  )
}
