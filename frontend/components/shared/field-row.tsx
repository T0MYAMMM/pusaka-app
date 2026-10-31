'use client'

import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** One labelled value with its actions on the right — the core of a vault item. */
export function FieldRow({
  label,
  children,
  actions,
}: {
  label: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-1 min-w-0 text-[0.9375rem]">{children}</div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
    </div>
  )
}

export function RevealButton({ shown, onToggle, label }: { shown: boolean; onToggle: () => void; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onToggle}
      aria-pressed={shown}
      aria-label={shown ? `Hide ${label}` : `Show ${label}`}
      className="text-muted-foreground hover:text-foreground"
    >
      {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
    </Button>
  )
}
