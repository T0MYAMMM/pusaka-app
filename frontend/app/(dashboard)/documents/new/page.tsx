'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentDropZone } from '@/components/features/document-drop-zone'
import { DocumentDetailsPanel, documentDetailsFrom, type DocumentDetailsValues } from '@/components/features/document-fields'
import { PageContainer, PageHeader, Panel } from '@/components/shared/page'
import { FormActions, useUnsavedChangesWarning } from '@/components/shared/form'
import { documentsApi } from '@/lib/api'
import { formatBytes } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const MAX_BYTES = 25 * 1024 * 1024

export default function NewDocumentPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { t } = useT()

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string>()
  const [titleError, setTitleError] = useState<string>()
  const [values, setValues] = useState<DocumentDetailsValues>(() => documentDetailsFrom())

  const { mutate, isPending } = useMutation({
    mutationFn: (form: FormData) => documentsApi.upload(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Document uploaded')
      router.push('/documents')
    },
    onError: (err: Error) => toast.error(err.message || 'Could not upload. Check your connection and try again.'),
  })

  const dirty = !!file || values.title !== '' || values.description !== '' || values.tags !== '' || values.expires_at !== ''
  useUnsavedChangesWarning(dirty && !isPending)

  const update = (patch: Partial<DocumentDetailsValues>) => {
    if (patch.title !== undefined && patch.title.trim()) setTitleError(undefined)
    setValues((v) => ({ ...v, ...patch }))
  }

  const handleFile = (f: File) => {
    if (f.size > MAX_BYTES) {
      setFileError(`“${f.name}” is ${formatBytes(f.size)}. Choose a file under 25 MB, or compress it first.`)
      return
    }
    setFileError(undefined)
    setFile(f)
    if (!values.title) {
      setValues((v) => ({ ...v, title: f.name.replace(/\.[^.]+$/, '') }))
      setTitleError(undefined)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let invalid = false
    if (!file) { setFileError('Choose a file to upload.'); invalid = true }
    if (!values.title.trim()) { setTitleError('Give it a title you will recognise, e.g. “Paspor Sari”.'); invalid = true }
    if (invalid || !file) return

    const form = new FormData()
    form.append('file', file)
    form.append('title', values.title.trim())
    form.append('document_type', values.document_type)
    if (values.description) form.append('description', values.description)
    if (values.tags) form.append('tags', values.tags)
    if (values.expires_at) form.append('expires_at', new Date(values.expires_at).toISOString())
    mutate(form)
  }

  return (
    <PageContainer size="narrow">
      <PageHeader
        back={{ href: '/documents', label: t.nav.documents }}
        title={t.nav.newDocument}
        description="The file is encrypted with your personal vault key before it is stored."
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Panel title="File" description="One file per document. Scans and photos work fine.">
          <DocumentDropZone
            file={file}
            onFile={handleFile}
            onClear={() => setFile(null)}
            error={fileError}
            hint="Up to 25 MB."
          />
        </Panel>

        <DocumentDetailsPanel values={values} onChange={update} titleError={titleError} />

        <FormActions>
          <Button variant="ghost" asChild>
            <Link href="/documents">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isPending ? 'Uploading…' : 'Upload document'}
          </Button>
        </FormActions>
      </form>
    </PageContainer>
  )
}
