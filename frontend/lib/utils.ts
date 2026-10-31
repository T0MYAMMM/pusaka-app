import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })
  if (bytes < 1024) return `${nf.format(bytes)} B`
  if (bytes < 1024 * 1024) return `${nf.format(bytes / 1024)} KB`
  return `${nf.format(bytes / (1024 * 1024))} MB`
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

/** "5 min. ago", "yesterday", "in 3 days" — locale-aware via Intl. */
export function formatDistanceToNow(dateStr: string, locale = 'en'): string {
  const seconds = Math.round((new Date(dateStr).getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 45) return locale === 'id' ? 'baru saja' : 'just now'
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
  for (const [unit, size] of UNITS) {
    if (abs >= size || unit === 'minute') return rtf.format(Math.round(seconds / size), unit)
  }
  return rtf.format(seconds, 'second')
}

/** "28 Oct 2026" in the user's locale. */
export function formatDate(dateStr: string, locale?: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, opts ?? { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr))
}
