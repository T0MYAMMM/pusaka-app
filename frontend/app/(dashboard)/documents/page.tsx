'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FolderArchive, Plus, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FavoriteButton } from '@/components/features/favorite-button'
import { documentTypeLabel } from '@/components/features/document-fields'
import { PageContainer, PageHeader } from '@/components/shared/page'
import { SearchField, FilterChips, FavoritesToggle } from '@/components/shared/filters'
import { EmptyState } from '@/components/shared/empty-state'
import { ItemTile } from '@/components/shared/item-tile'
import { ExpiryBadge, TagList } from '@/components/shared/badges'
import { Pagination } from '@/components/shared/pagination'
import { documentsApi, type Document } from '@/lib/api'
import { DOCUMENT_TYPES, documentMeta } from '@/lib/item-meta'
import { formatBytes, formatDistanceToNow } from '@/lib/utils'
import { useT } from '@/lib/i18n'

function DocumentCard({ doc, queryKey }: { doc: Document; queryKey: unknown[] }) {
  const { t, lang } = useT()
  const meta = documentMeta(doc.document_type)

  return (
    <li className="group relative flex flex-col rounded-xl border bg-card transition-colors hover:border-input hover:bg-muted/40">
      <div className="flex items-start gap-3 p-4 pb-3">
        <ItemTile icon={meta.icon} tone={meta.tone} />
        <div className="min-w-0 flex-1 pt-0.5">
          {/* Stretched link: the card opens the document, the favorite stays its own button. */}
          <Link
            href={`/documents/${doc.id}`}
            className="block truncate text-sm font-semibold outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
          >
            {doc.title}
          </Link>
          <p className="mt-0.5 truncate text-[0.8125rem] text-muted-foreground">
            {documentTypeLabel(t, doc.document_type)}
            <span aria-hidden="true"> · </span>
            <span className="tabular">{formatBytes(doc.file_size)}</span>
          </p>
        </div>
        <div className="relative z-10 -mr-1.5 -mt-1 shrink-0">
          <FavoriteButton id={doc.id} kind="document" isFavorite={doc.is_favorite} queryKey={queryKey} />
        </div>
      </div>
      <div className="mt-auto flex min-h-11 items-center gap-2 border-t px-4 py-2.5">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground" translate="no" title={doc.file_name}>
          {doc.file_name}
        </span>
        <TagList tags={doc.tags} max={1} className="hidden shrink-0 flex-nowrap sm:inline-flex" />
        <ExpiryBadge expiresAt={doc.expires_at} />
        <span className="shrink-0 text-xs text-muted-foreground tabular">{formatDistanceToNow(doc.updated_at, lang)}</span>
      </div>
    </li>
  )
}

function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="rounded-xl border bg-card">
          <div className="flex items-start gap-3 p-4 pb-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-12" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function DocumentsList() {
  const sp = useSearchParams()
  const router = useRouter()
  const { t } = useT()
  const [search, setSearch] = useState(sp.get('q') ?? '')
  const q = sp.get('q') ?? ''
  const type = sp.get('type') ?? 'all'
  const favOnly = sp.get('favorites_only') === 'true'
  const page = Number(sp.get('page') ?? 1)
  const queryKey = ['documents', q, type, favOnly, page]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => documentsApi.list({
      q: q || undefined,
      type_filter: type === 'all' ? undefined : type,
      favorites_only: favOnly || undefined,
      page,
    }),
  })

  const updateParam = (key: string, val: string | null, keepPage = false) => {
    const p = new URLSearchParams(sp.toString())
    if (val) p.set(key, val)
    else p.delete(key)
    if (!keepPage) p.delete('page')
    router.push(`/documents${p.size ? `?${p}` : ''}`)
  }

  const filtered = !!q || type !== 'all' || favOnly
  const clearFilters = () => { setSearch(''); router.push('/documents') }

  const typeOptions = [
    { value: 'all', label: t.common.all },
    ...Object.keys(DOCUMENT_TYPES).map((value) => ({ value, label: documentTypeLabel(t, value) })),
  ]

  return (
    <PageContainer size="wide">
      <PageHeader
        title={t.documents.title}
        description={data ? `${data.total} kept — scans of IDs, certificates and policies.` : 'Scans of IDs, certificates and policies.'}
        actions={
          <Button asChild>
            <Link href="/documents/new"><Plus aria-hidden="true" />{t.nav.newDocument}</Link>
          </Button>
        }
      />

      <div className="space-y-3">
        <div className="flex gap-2">
          <SearchField
            value={search}
            onChange={setSearch}
            onSubmit={(v) => updateParam('q', v.trim() || null)}
            placeholder={t.documents.searchPlaceholder}
            label={t.documents.searchPlaceholder}
          />
          <FavoritesToggle
            pressed={favOnly}
            onPressedChange={(p) => updateParam('favorites_only', p ? 'true' : null)}
            label={t.common.favorites}
          />
        </div>
        <FilterChips
          label={t.documents.docType}
          options={typeOptions}
          value={type}
          onChange={(v) => updateParam('type', v === 'all' ? null : v)}
        />
      </div>

      <div className="mt-5">
        {isLoading ? (
          <CardsSkeleton />
        ) : data?.items.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={SearchX}
              title="Nothing matches these filters"
              description="Try a different word, or clear the filters to see every document."
              action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
            />
          ) : (
            <EmptyState
              icon={FolderArchive}
              title="Keep important papers in one place"
              description="Upload a scan of your KTP, passport, diplomas or insurance policy. Files are encrypted before they are stored."
              action={<Button asChild><Link href="/documents/new"><Plus aria-hidden="true" />{t.documents.addFirst}</Link></Button>}
            />
          )
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data?.items.map((doc) => <DocumentCard key={doc.id} doc={doc} queryKey={queryKey} />)}
          </ul>
        )}

        {data && (
          <Pagination page={page} pages={data.pages} onPageChange={(p) => updateParam('page', String(p), true)} />
        )}
      </div>
    </PageContainer>
  )
}

export default function DocumentsPage() {
  return <Suspense><DocumentsList /></Suspense>
}
