'use client'

import { Star } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { credentialsApi, notesApi, documentsApi } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Props {
  id: number
  kind: 'credential' | 'note' | 'document'
  isFavorite: boolean
  queryKey: unknown[]
  className?: string
}

export function FavoriteButton({ id, kind, isFavorite, queryKey, className }: Props) {
  const qc = useQueryClient()

  const { mutate, isPending } = useMutation<void, Error, void, { prev: unknown }>({
    mutationFn: async () => {
      await (kind === 'credential'
        ? credentialsApi.toggleFavorite(id)
        : kind === 'note'
          ? notesApi.toggleFavorite(id)
          : documentsApi.toggleFavorite(id)
      )
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey })
      const prev = qc.getQueryData(queryKey)
      // Optimistic update — flip is_favorite in cached data
      qc.setQueryData(queryKey, (old: unknown) => {
        if (!old) return old
        const flip = (item: { id: number; is_favorite: boolean }) =>
          item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
        if (Array.isArray(old)) return old.map(flip)
        if (typeof old === 'object' && old !== null && 'items' in old) {
          return { ...(old as object), items: (old as { items: { id: number; is_favorite: boolean }[] }).items.map(flip) }
        }
        if (typeof old === 'object' && old !== null && 'is_favorite' in old) {
          return { ...(old as object), is_favorite: !(old as { is_favorite: boolean }).is_favorite }
        }
        return old
      })
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(queryKey, ctx?.prev)
      toast.error('Could not update favorites. Check your connection and try again.')
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey })
      // Keep the matching list and the dashboard in step with a detail-page toggle.
      qc.invalidateQueries({ queryKey: [`${kind}s`] })
      qc.invalidateQueries({ queryKey: [kind] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); mutate() }}
      disabled={isPending}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      className={className}
    >
      <Star className={cn('size-4', isFavorite ? 'fill-brass text-brass' : 'text-muted-foreground')} aria-hidden="true" />
    </Button>
  )
}
