'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { documentsApi } from '@/lib/api'
import { formatBytes } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const DOC_TYPES = ['identity', 'certificate', 'financial', 'medical', 'legal', 'insurance', 'travel', 'other']

export default function NewDocumentPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { t } = useT()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [documentType, setDocumentType] = useState('other')
  const [tags, setTags] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (form: FormData) => documentsApi.upload(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Document uploaded')
      router.push('/documents')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleFile = (f: File) => {
    if (f.size > 25 * 1024 * 1024) {
      toast.error('File exceeds 25 MB limit')
      return
    }
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { toast.error('Please select a file'); return }
    if (!title.trim()) { toast.error('Title is required'); return }

    const form = new FormData()
    form.append('file', file)
    form.append('title', title.trim())
    form.append('document_type', documentType)
    if (description) form.append('description', description)
    if (tags) form.append('tags', tags)
    if (expiresAt) form.append('expires_at', new Date(expiresAt).toISOString())
    mutate(form)
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.documents.upload}</h1>
        <p className="text-sm text-muted-foreground">{t.documents.maxSize}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File drop zone */}
        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="text-left">
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t.documents.dragDrop}</p>
              <p className="text-xs text-muted-foreground">{t.documents.maxSize}</p>
            </div>
          )}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Document details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-type">{t.documents.docType}</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="doc-type">
                  <SelectValue />
                </SelectTrigger>
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
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending || !file}>
            {isPending ? t.common.loading : t.documents.upload}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>{t.common.cancel}</Button>
        </div>
      </form>
    </div>
  )
}
