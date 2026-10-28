'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NoteForm, type NoteFormValues } from '@/components/features/note-form'
import { EmptyState } from '@/components/shared/empty-state'
import { PageContainer, PageHeader } from '@/components/shared/page'
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
      toast.success(`“${note.title}” updated`)
      router.push(`/notes/${id}`)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not save changes. Try again.'),
  })

  if (isLoading) {
    return (
      <PageContainer size="narrow" className="space-y-5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </PageContainer>
    )
  }

  if (!data) {
    return (
      <PageContainer size="narrow">
        <EmptyState
          icon={StickyNote}
          title="This note doesn’t exist"
          description="It may have been deleted, or the link is wrong."
          action={<Button asChild variant="outline"><Link href="/notes">Back to notes</Link></Button>}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="narrow">
      <PageHeader back={{ href: `/notes/${id}`, label: data.title }} title={`Edit ${data.title}`} />
      <NoteForm
        defaultValues={data}
        submitLabel="Save changes"
        cancelHref={`/notes/${id}`}
        isSubmitting={isPending}
        onSubmit={async (d) => { await mutateAsync(d) }}
      />
    </PageContainer>
  )
}
