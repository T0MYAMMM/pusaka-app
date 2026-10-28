'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, File as FileGeneric, FileImage, FileText, FolderArchive, Pencil, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TypeBadge } from '@/components/features/credential-type-badge'
import { CopyButton } from '@/components/features/copy-button'
import { DeleteDialog } from '@/components/features/delete-dialog'
import { documentTypeLabel } from '@/components/features/document-fields'
import { PageContainer, PageHeader, Panel } from '@/components/shared/page'
import { ItemTile } from '@/components/shared/item-tile'
import { EmptyState } from '@/components/shared/empty-state'
import { ExpiryBadge, TagList } from '@/components/shared/badges'
import { MetaList } from '@/components/shared/kbd'
import { documentsApi } from '@/lib/api'
import { daysUntil, documentMeta } from '@/lib/item-meta'
import { cn, formatBytes, formatDate, formatDistanceToNow } from '@/lib/utils'
import { useT } from '@/lib/i18n'

function fileFormat(fileName: string, mime: string) {
  const ext = fileName.includes('.') ? fileName.split('.').pop() : null
  return ext ? ext.toUpperCase() : mime
}

function fileIcon(mime: string) {
  if (mime.startsWith('image/')) return FileImage
  if (mime === 'application/pdf' || mime.startsWith('text/')) return FileText
  return FileGeneric
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { t, lang } = useT()
  const docId = Number(id)

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', docId],
    queryFn: () => documentsApi.get(docId),
  })

  const deleteMutation = useMutation({
    mutationFn: () => documentsApi.delete(docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Document deleted')
      router.push('/documents')
    },
    onError: (err: Error) => toast.error(err.message || 'Could not delete. Try again in a moment.'),
  })

  // Kept local (not <FavoriteButton>) so the list cache is refreshed as well.
  const favMutation = useMutation({
    mutationFn: () => documentsApi.toggleFavorite(docId),
    onSuccess: (updated) => {
      qc.setQueryData(['document', docId], updated)
      qc.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => toast.error('Could not update favorites. Check your connection and try again.'),
  })

  if (isLoading) {
    return (
      <PageContainer className="space-y-6">
        <Skeleton className="h-5 w-28" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-xl" />
          <div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-32" /></div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-5"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-40 rounded-xl" /></div>
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </PageContainer>
    )
  }

  if (!doc) {
    return (
      <PageContainer>
        <EmptyState
          icon={FolderArchive}
          title="This document doesn’t exist"
          description="It may have been deleted, or the link is wrong."
          action={<Button asChild variant="outline"><Link href="/documents">Back to documents</Link></Button>}
        />
      </PageContainer>
    )
  }

  const meta = documentMeta(doc.document_type)
  const typeLabel = documentTypeLabel(t, doc.document_type)
  const days = daysUntil(doc.expires_at)
  const format = fileFormat(doc.file_name, doc.mime_type)
  const FileIcon = fileIcon(doc.mime_type)
  const isFavorite = doc.is_favorite

  return (
    <PageContainer>
      <PageHeader
        back={{ href: '/documents', label: t.nav.documents }}
        leading={<ItemTile icon={meta.icon} tone={meta.tone} size="lg" />}
        title={doc.title}
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => favMutation.mutate()}
              disabled={favMutation.isPending}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={cn('size-4', isFavorite ? 'fill-brass text-brass' : 'text-muted-foreground')} aria-hidden="true" />
            </Button>
            <Button asChild>
              <a href={documentsApi.downloadUrl(docId)}><Download aria-hidden="true" />{t.documents.download}</a>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/documents/${docId}/edit`}><Pencil aria-hidden="true" />{t.common.edit}</Link>
            </Button>
            {/* Four actions do not fit one row on phones, so Delete collapses to an icon there. */}
            {[true, false].map((iconOnly) => (
              <span key={String(iconOnly)} className={iconOnly ? 'inline-flex sm:hidden' : 'hidden sm:inline-flex'}>
                <DeleteDialog
                  iconOnly={iconOnly}
                  itemName={doc.title}
                  onConfirm={() => deleteMutation.mutate()}
                  isPending={deleteMutation.isPending}
                  description="The file and its details will be permanently removed from your vault. This cannot be undone."
                />
              </span>
            ))}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <TypeBadge meta={meta} label={typeLabel} />
          <ExpiryBadge expiresAt={doc.expires_at} />
          <TagList tags={doc.tags} />
        </div>
      </PageHeader>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-5">
          <section aria-label="File" className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
            <ItemTile icon={FileIcon} tone="slate" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm font-medium" translate="no" title={doc.file_name}>{doc.file_name}</p>
              <p className="mt-0.5 text-[0.8125rem] text-muted-foreground tabular">
                {format} · {formatBytes(doc.file_size)}
              </p>
            </div>
            <CopyButton value={doc.file_name} label="File name" />
          </section>

          <Panel title="Description">
            {doc.description ? (
              <p className="max-w-[75ch] text-[0.9375rem] leading-relaxed whitespace-pre-wrap break-words">{doc.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No description yet. Note the document number or where the original is kept.{' '}
                <Link href={`/documents/${docId}/edit`} className="font-medium text-primary hover:underline">Add a description</Link>
              </p>
            )}
          </Panel>
        </div>

        <aside>
          <Panel title="Details">
            <MetaList
              items={[
                { label: 'Type', value: typeLabel },
                { label: 'Format', value: format },
                { label: 'Size', value: <span className="tabular">{formatBytes(doc.file_size)}</span> },
                ...(doc.expires_at
                  ? [{
                      label: 'Expires',
                      value: (
                        <span className={days !== null && days < 0 ? 'text-destructive' : days !== null && days <= 14 ? 'text-warning' : undefined}>
                          {formatDate(doc.expires_at, lang)}
                        </span>
                      ),
                    }]
                  : []),
                { label: 'Uploaded', value: formatDate(doc.created_at, lang) },
                { label: 'Updated', value: formatDistanceToNow(doc.updated_at, lang) },
              ]}
            />
          </Panel>
        </aside>
      </div>
    </PageContainer>
  )
}
