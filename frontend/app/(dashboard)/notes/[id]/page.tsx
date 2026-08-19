'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Edit, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { FavoriteButton } from '@/components/features/favorite-button'
import { CopyButton } from '@/components/features/copy-button'
import { DeleteDialog } from '@/components/features/delete-dialog'
import { notesApi } from '@/lib/api'
import { formatDistanceToNow } from '@/lib/utils'

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: () => notesApi.get(Number(id)),
  })

  const { mutate: doDelete, isPending: deleting } = useMutation({
    mutationFn: () => notesApi.delete(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Note deleted')
      router.push('/notes')
    },
    onError: () => toast.error('Delete failed'),
  })

  if (isLoading) return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64" />
    </div>
  )

  if (!data) return <div className="p-4 sm:p-6 text-sm text-muted-foreground">Note not found.</div>

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/notes"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{data.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{data.type}</Badge>
            {data.tags?.split(',').map((t) => <Badge key={t} variant="outline" className="text-xs">{t.trim()}</Badge>)}
          </div>
        </div>
        <FavoriteButton id={data.id} kind="note" isFavorite={data.is_favorite} queryKey={['note', id]} />
        <Link href={`/notes/${id}/edit`}><Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" />Edit</Button></Link>
        <DeleteDialog itemName={data.title} onConfirm={() => doDelete()} isPending={deleting} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Content</CardTitle>
          <CopyButton value={data.content} label="Note content" />
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{data.content}</pre>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Created {formatDistanceToNow(data.created_at)} · Updated {formatDistanceToNow(data.updated_at)}
        {data.last_accessed && ` · Last viewed ${formatDistanceToNow(data.last_accessed)}`}
      </p>
    </div>
  )
}
