'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NoteForm, type NoteFormValues } from '@/components/features/note-form'
import { notesApi } from '@/lib/api'

export default function NewNotePage() {
  const router = useRouter()
  const qc = useQueryClient()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: NoteFormValues) => notesApi.create(data),
    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`"${note.title}" created`)
      router.push(`/notes/${note.id}`)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Create failed'),
  })

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/notes"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Add Secure Note</h1>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Note Details</CardTitle></CardHeader>
        <CardContent>
          <NoteForm submitLabel="Save Note" isSubmitting={isPending} onSubmit={async (d) => { await mutateAsync(d) }} />
        </CardContent>
      </Card>
    </div>
  )
}
