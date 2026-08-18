'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { documentsApi, type DocumentUpdate } from '@/lib/api'
import { useT } from '@/lib/i18n'

const DOC_TYPES = ['identity', 'certificate', 'financial', 'medical', 'legal', 'insurance', 'travel', 'other']

export default function EditDocumentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { t } = useT()
  const docId = Number(id)

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', docId],
    queryFn: () => documentsApi.get(docId),
  })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [documentType, setDocumentType] = useState('other')
  const [tags, setTags] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  useEffect(() => {
    if (doc) {
      setTitle(doc.title)
      setDescription(doc.description ?? '')
      setDocumentType(doc.document_type)
      setTags(doc.tags ?? '')
      setExpiresAt(doc.expires_at ? doc.expires_at.slice(0, 10) : '')
    }
  }, [doc])

  const { mutate, isPending } = useMutation({
    mutationFn: (body: DocumentUpdate) => documentsApi.update(docId, body),
    onSuccess: (updated) => {
      qc.setQueryData(['document', docId], updated)
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document updated')
      router.push(`/documents/${docId}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    mutate({
      title: title.trim(),
      description: description || null,
      document_type: documentType,
      tags: tags || null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    })
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <p className="text-muted-foreground">Document not found.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.common.edit}: {doc.title}</h1>
        <p className="text-sm text-muted-foreground">{doc.file_name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="doc-type">{t.documents.docType}</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger id="doc-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOC_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t.documents.types[type as keyof typeof t.documents.types]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. personal, 2024" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expires-at">Expires at</Label>
            <Input id="expires-at" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? t.common.loading : t.common.save}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>{t.common.cancel}</Button>
        </div>
      </form>
    </div>
  )
}
