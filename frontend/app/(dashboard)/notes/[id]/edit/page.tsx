'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { NoteForm, type NoteFormValues } from '@/components/features/note-form'
import { notesApi } from '@/lib/api'

export default function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: () => notesApi.get(Number(id)),
  })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: NoteFormValues) => notesApi.update(Number(id), values),
    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      qc.invalidateQueries({ queryKey: ['note', id] })
      toast.success(`"${note.title}" updated`)
      router.push(`/notes/${id}`)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Update failed'),
  })

  if (isLoading) return <div className="space-y-4 p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>
  if (!data) return <div className="p-6 text-muted-foreground">Note not found.</div>

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/notes/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Edit {data.title}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Note Details</CardTitle></CardHeader>
        <CardContent>
          <NoteForm defaultValues={data} submitLabel="Update Note" isSubmitting={isPending} onSubmit={async (d) => { await mutateAsync(d) }} />
        </CardContent>
      </Card>
    </div>
  )
}
