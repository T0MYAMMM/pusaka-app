import {
  Globe, Mail, AtSign, Landmark, Briefcase, User, Server, KeyRound, Folder,
  FileText, Wallet, HeartPulse, Scale, Terminal, StickyNote,
  IdCard, GraduationCap, ShieldCheck, Plane, File,
  type LucideIcon,
} from 'lucide-react'

/**
 * Tones are soft tints from the palette. They make long lists scannable by
 * category; the icon carries the meaning, the tone only helps the eye.
 */
export const TONES = {
  indigo: 'bg-accent text-primary',
  sky: 'bg-info-soft text-info',
  jade: 'bg-success-soft text-success',
  amber: 'bg-warning-soft text-warning',
  rose: 'bg-danger-soft text-destructive',
  brass: 'bg-brass-soft text-brass-foreground',
  slate: 'bg-muted text-muted-foreground',
} as const

export type Tone = keyof typeof TONES

export interface ItemMeta {
  label: string
  icon: LucideIcon
  tone: Tone
}

export const CREDENTIAL_TYPES: Record<string, ItemMeta> = {
  website:  { label: 'Website',  icon: Globe,     tone: 'sky' },
  email:    { label: 'Email',    icon: Mail,      tone: 'indigo' },
  social:   { label: 'Social',   icon: AtSign,    tone: 'rose' },
  banking:  { label: 'Banking',  icon: Landmark,  tone: 'jade' },
  work:     { label: 'Work',     icon: Briefcase, tone: 'amber' },
  personal: { label: 'Personal', icon: User,      tone: 'brass' },
  server:   { label: 'Server',   icon: Server,    tone: 'slate' },
  api:      { label: 'API key',  icon: KeyRound,  tone: 'indigo' },
  other:    { label: 'Other',    icon: Folder,    tone: 'slate' },
}

export const NOTE_TYPES: Record<string, ItemMeta> = {
  personal:  { label: 'Personal',  icon: StickyNote, tone: 'brass' },
  work:      { label: 'Work',      icon: Briefcase,  tone: 'amber' },
  financial: { label: 'Financial', icon: Wallet,     tone: 'jade' },
  medical:   { label: 'Medical',   icon: HeartPulse, tone: 'rose' },
  legal:     { label: 'Legal',     icon: Scale,      tone: 'indigo' },
  technical: { label: 'Technical', icon: Terminal,   tone: 'slate' },
  other:     { label: 'Other',     icon: FileText,   tone: 'slate' },
}

export const DOCUMENT_TYPES: Record<string, ItemMeta> = {
  identity:    { label: 'Identity',    icon: IdCard,        tone: 'indigo' },
  certificate: { label: 'Certificate', icon: GraduationCap, tone: 'brass' },
  financial:   { label: 'Financial',   icon: Wallet,        tone: 'jade' },
  medical:     { label: 'Medical',     icon: HeartPulse,    tone: 'rose' },
  legal:       { label: 'Legal',       icon: Scale,         tone: 'slate' },
  insurance:   { label: 'Insurance',   icon: ShieldCheck,   tone: 'sky' },
  travel:      { label: 'Travel',      icon: Plane,         tone: 'amber' },
  other:       { label: 'Other',       icon: File,          tone: 'slate' },
}

export const credentialMeta = (type: string) => CREDENTIAL_TYPES[type] ?? CREDENTIAL_TYPES.other
export const noteMeta = (type: string) => NOTE_TYPES[type] ?? NOTE_TYPES.other
export const documentMeta = (type: string) => DOCUMENT_TYPES[type] ?? DOCUMENT_TYPES.other

/** Split the backend's comma-separated tag string into clean tags. */
export function splitTags(tags: string | null | undefined): string[] {
  if (!tags) return []
  return tags.split(',').map((t) => t.trim()).filter(Boolean)
}

/** Days until a date (negative when past), or null. */
export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}
