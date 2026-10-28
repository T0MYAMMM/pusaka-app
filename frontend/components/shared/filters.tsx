'use client'

import { Search, Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Search field used at the top of every list. Submits on Enter so the
 * query lands in the URL (shareable, back-button friendly).
 */
export function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder,
  label,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  placeholder: string
  label: string
  className?: string
}) {
  return (
    <form
      role="search"
      className={cn('relative min-w-0 flex-1', className)}
      onSubmit={(e) => { e.preventDefault(); onSubmit(value) }}
    >
      <label htmlFor="list-search" className="sr-only">{label}</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        id="list-search"
        name="q"
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-9 text-sm shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => { onChange(''); onSubmit('') }}
          className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </form>
  )
}

/** A horizontally scrolling row of single-select chips. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string; count?: number }[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  return (
    <div role="group" aria-label={label} className={cn('scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[0.8125rem] font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-input hover:text-foreground',
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn('tabular text-xs', active ? 'text-primary-foreground/75' : 'text-muted-foreground/80')}>{o.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Favorites-only toggle. Brass, because favorites are the brass thing. */
export function FavoritesToggle({
  pressed,
  onPressedChange,
  label,
}: {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
        pressed
          ? 'border-brass/60 bg-brass-soft text-brass-foreground'
          : 'border-input bg-card text-muted-foreground shadow-xs hover:text-foreground',
      )}
    >
      <Star className={cn('size-4', pressed && 'fill-brass text-brass')} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </button>
  )
}
