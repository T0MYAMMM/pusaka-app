'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TypeBadge } from '@/components/features/credential-type-badge'
import { FavoriteButton } from '@/components/features/favorite-button'
import { CopyButton } from '@/components/features/copy-button'
import { DeleteDialog } from '@/components/features/delete-dialog'
import { PageContainer, PageHeader, Panel } from '@/components/shared/page'
import { ItemTile } from '@/components/shared/item-tile'
import { EmptyState } from '@/components/shared/empty-state'
import { TagList } from '@/components/shared/badges'
import { MetaList } from '@/components/shared/kbd'
import { notesApi } from '@/lib/api'
import { noteMeta } from '@/lib/item-meta'
import { cn, formatDate, formatDistanceToNow } from '@/lib/utils'
import { useT } from '@/lib/i18n'

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const { t, lang } = useT()

  const { data, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: () => notesApi.get(Number(id)),
  })

  const { mutate: doDelete, isPending: deleting } = useMutation({
    mutationFn: () => notesApi.delete(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Note deleted')
      router.push('/notes')
    },
    onError: () => toast.error('Could not delete. Try again in a moment.'),
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
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </PageContainer>
    )
  }

  if (!data) {
    return (
      <PageContainer>
        <EmptyState
          icon={StickyNote}
          title="This note doesn’t exist"
          description="It may have been deleted, or the link is wrong."
          action={<Button asChild variant="outline"><Link href="/notes">Back to notes</Link></Button>}
        />
      </PageContainer>
    )
  }

  const meta = noteMeta(data.type)
  const technical = data.type === 'technical'

  return (
    <PageContainer>
      <PageHeader
        back={{ href: '/notes', label: t.nav.notes }}
        leading={<ItemTile icon={meta.icon} tone={meta.tone} size="lg" />}
        title={data.title}
        actions={
          <>
            <FavoriteButton id={data.id} kind="note" isFavorite={data.is_favorite} queryKey={['note', id]} className="size-10" />
            <Button variant="outline" asChild>
              <Link href={`/notes/${id}/edit`}><Pencil aria-hidden="true" />{t.common.edit}</Link>
            </Button>
            <DeleteDialog itemName={data.title} onConfirm={() => doDelete()} isPending={deleting} />
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <TypeBadge meta={meta} />
          <TagList tags={data.tags} />
        </div>
      </PageHeader>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_18rem]">
        <Panel
          title="Note"
          action={data.content ? <CopyButton value={data.content} label="Note" /> : undefined}
          bodyClassName="px-5 py-5 sm:px-6"
        >
          {data.content ? (
            <div
              className={cn(
                'max-w-[75ch] whitespace-pre-wrap break-words',
                technical ? 'font-mono text-sm leading-6' : 'text-[0.9375rem] leading-relaxed',
              )}
              translate={technical ? 'no' : undefined}
            >
              {data.content}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This note is empty.{' '}
              <Link href={`/notes/${id}/edit`} className="font-medium text-primary hover:underline">Add content</Link>
            </p>
          )}
        </Panel>

        <aside className="space-y-5">
          <Panel title="Details">
            <MetaList
              items={[
                { label: 'Category', value: meta.label },
                { label: 'Created', value: formatDate(data.created_at, lang) },
                { label: 'Updated', value: formatDistanceToNow(data.updated_at, lang) },
                ...(data.last_accessed ? [{ label: 'Last viewed', value: formatDistanceToNow(data.last_accessed, lang) }] : []),
              ]}
            />
          </Panel>
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Copied text is cleared from your clipboard after 30 seconds.
          </p>
        </aside>
      </div>
    </PageContainer>
  )
}
