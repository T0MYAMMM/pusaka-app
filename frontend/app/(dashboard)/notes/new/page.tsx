'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { NoteForm, type NoteFormValues } from '@/components/features/note-form'
import { PageContainer, PageHeader } from '@/components/shared/page'
import { notesApi } from '@/lib/api'
import { useT } from '@/lib/i18n'

export default function NewNotePage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { t } = useT()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: NoteFormValues) => notesApi.create(data),
    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`“${note.title}” saved to your vault`)
      router.push(`/notes/${note.id}`)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not save. Check the fields and try again.'),
  })

  return (
    <PageContainer size="narrow">
      <PageHeader
        back={{ href: '/notes', label: t.nav.notes }}
        title={t.nav.newNote}
        description="The content is encrypted with your personal vault key before it is stored."
      />
      <NoteForm
        submitLabel="Save note"
        cancelHref="/notes"
        isSubmitting={isPending}
        onSubmit={async (d) => { await mutateAsync(d) }}
      />
    </PageContainer>
  )
}
