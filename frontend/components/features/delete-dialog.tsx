'use client'

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface Props {
  itemName: string
  onConfirm: () => void
  isPending?: boolean
  /** What happens on delete; defaults to permanent removal from the vault. */
  description?: string
  /** Render the trigger as an icon button. */
  iconOnly?: boolean
}

export function DeleteDialog({ itemName, onConfirm, isPending, description, iconOnly = false }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {iconOnly ? (
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isPending}
            aria-label={`Delete ${itemName}`}
            className="text-muted-foreground hover:bg-danger-soft hover:text-destructive"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled={isPending}
            className="text-destructive hover:bg-danger-soft hover:text-destructive"
          >
            <Trash2 aria-hidden="true" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{itemName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? 'It will be permanently removed from your vault. This cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
