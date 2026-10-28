'use client'

import type { LucideIcon } from 'lucide-react'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

/**
 * Confirmation for destructive actions that are not a plain "delete":
 * revoking a key, removing a member, taking an item out of a vault.
 * The trigger is an icon button; the confirm button names the action.
 */
export function ConfirmAction({
  title,
  description,
  confirmLabel,
  triggerLabel,
  onConfirm,
  isPending,
  icon: Icon = Trash2,
  cancelLabel = 'Cancel',
}: {
  title: string
  description: string
  /** Specific verb for the confirm button, e.g. "Revoke key". */
  confirmLabel: string
  /** Accessible name for the icon trigger, e.g. "Revoke GitHub Actions". */
  triggerLabel: string
  onConfirm: () => void
  isPending?: boolean
  icon?: LucideIcon
  cancelLabel?: string
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          aria-label={triggerLabel}
          title={triggerLabel}
          className="text-muted-foreground hover:bg-danger-soft hover:text-destructive"
        >
          <Icon aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
