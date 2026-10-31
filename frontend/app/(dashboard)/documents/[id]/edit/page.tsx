'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FolderArchive, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DocumentDetailsPanel, documentDetailsFrom, type DocumentDetailsValues } from '@/components/features/document-fields'
import { EmptyState } from '@/components/shared/empty-state'
import { PageContainer, PageHeader } from '@/components/shared/page'
import { FormActions, useUnsavedChangesWarning } from '@/components/shared/form'
import { documentsApi, type Document, type DocumentUpdate } from '@/lib/api'
import { formatBytes } from '@/lib/utils'

function EditDocumentForm({ doc }: { doc: Document }) {
  const router = useRouter()
  const qc = useQueryClient()
  const docId = doc.id
  const [initial] = useState(() => documentDetailsFrom(doc))
  const [values, setValues] = useState<DocumentDetailsValues>(initial)
  const [titleError, setTitleError] = useState<string>()

  const { mutate, isPending } = useMutation({
    mutationFn: (body: DocumentUpdate) => documentsApi.update(docId, body),
    onSuccess: (updated) => {
      qc.setQueryData(['document', docId], updated)
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success(`“${updated.title}” updated`)
      router.push(`/documents/${docId}`)
    },
    onError: (err: Error) => toast.error(err.message || 'Could not save changes. Try again.'),
  })

  const dirty = (Object.keys(initial) as (keyof DocumentDetailsValues)[]).some((k) => initial[k] !== values[k])
  useUnsavedChangesWarning(dirty && !isPending)

  const update = (patch: Partial<DocumentDetailsValues>) => {
    if (patch.title !== undefined && patch.title.trim()) setTitleError(undefined)
    setValues((v) => ({ ...v, ...patch }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.title.trim()) { setTitleError('Give it a title you will recognise, e.g. “Paspor Sari”.'); return }
    mutate({
      title: values.title.trim(),
      description: values.description || null,
      document_type: values.document_type,
      tags: values.tags || null,
      expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
    })
  }

  return (
    <PageContainer size="narrow">
      <PageHeader
        back={{ href: `/documents/${docId}`, label: doc.title }}
        title={`Edit ${doc.title}`}
        description={
          <>
            <span className="font-mono text-[0.8125rem]" translate="no">{doc.file_name}</span>
            <span className="tabular"> · {formatBytes(doc.file_size)}</span>
            <span className="block pt-1 text-[0.8125rem]">To replace the file itself, upload it as a new document.</span>
          </>
        }
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <DocumentDetailsPanel values={values} onChange={update} titleError={titleError} />

        <FormActions>
          <Button variant="ghost" asChild>
            <Link href={`/documents/${docId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </FormActions>
      </form>
    </PageContainer>
  )
}

export default function EditDocumentPage() {
  const { id } = useParams<{ id: string }>()
  const docId = Number(id)

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', docId],
    queryFn: () => documentsApi.get(docId),
  })

  if (isLoading) {
    return (
      <PageContainer size="narrow" className="space-y-5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </PageContainer>
    )
  }

  if (!doc) {
    return (
      <PageContainer size="narrow">
        <EmptyState
          icon={FolderArchive}
          title="This document doesn’t exist"
          description="It may have been deleted, or the link is wrong."
          action={<Button asChild variant="outline"><Link href="/documents">Back to documents</Link></Button>}
        />
      </PageContainer>
    )
  }

  return <EditDocumentForm key={doc.id} doc={doc} />
}
