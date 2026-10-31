'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { passwordStrength } from '@/lib/password'

/** Label, control, hint and inline error, wired together for screen readers. */
export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
  className,
  labelAction,
}: {
  id: string
  label: string
  required?: boolean
  hint?: React.ReactNode
  error?: string
  children: React.ReactNode
  className?: string
  /** Small element aligned right of the label (e.g. "Forgot password?"). */
  labelAction?: React.ReactNode
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-[0.8125rem] font-semibold">
          {label}
          {required && <span className="text-destructive" aria-hidden="true">*</span>}
        </Label>
        {labelAction}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

/** Props to spread on a control inside <Field> so it announces its error/hint. */
export function fieldAria(id: string, error?: string, hasHint?: boolean) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  } as const
}

/** Password input with a show/hide toggle. Extra trailing actions can be passed in. */
export function PasswordInput({
  className,
  trailing,
  ...props
}: React.ComponentProps<'input'> & { trailing?: React.ReactNode }) {
  const [shown, setShown] = useState(false)
  return (
    <div className="relative">
      <Input
        {...props}
        type={shown ? 'text' : 'password'}
        spellCheck={false}
        className={cn('pr-20 font-mono tracking-wide', !shown && 'tracking-[0.12em]', className)}
      />
      <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
        {trailing}
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {shown ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

const STRENGTH_COLORS = ['bg-muted', 'bg-destructive', 'bg-warning', 'bg-info', 'bg-success']
const STRENGTH_TEXT = ['', 'text-destructive', 'text-warning', 'text-info', 'text-success']

export function StrengthMeter({ password }: { password: string }) {
  const { score, label } = passwordStrength(password)
  if (!password) return null
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= score ? STRENGTH_COLORS[score] : 'bg-muted')} />
        ))}
      </div>
      <p className={cn('w-14 text-right text-xs font-semibold', STRENGTH_TEXT[score])}>{label}</p>
    </div>
  )
}

/** Warns before closing the tab while a form has unsaved edits. */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])
}

/** Sticky footer that keeps the primary action in reach on long forms. */
export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-2 flex items-center justify-end gap-2 border-t bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {children}
    </div>
  )
}
