'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, SearchX, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FavoriteButton } from '@/components/features/favorite-button'
import { PageContainer, PageHeader } from '@/components/shared/page'
import { SearchField, FavoritesToggle } from '@/components/shared/filters'
import { EmptyState } from '@/components/shared/empty-state'
import { ItemTile } from '@/components/shared/item-tile'
import { TagList } from '@/components/shared/badges'
import { Pagination } from '@/components/shared/pagination'
import { notesApi, type Note } from '@/lib/api'
import { noteMeta } from '@/lib/item-meta'
import { formatDistanceToNow } from '@/lib/utils'
import { useT } from '@/lib/i18n'

function NoteRow({ n, queryKey }: { n: Note; queryKey: unknown[] }) {
  const { lang } = useT()
  const meta = noteMeta(n.type)

  return (
    <li className="group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:gap-4 sm:px-5">
      <ItemTile icon={meta.icon} tone={meta.tone} />
      <div className="min-w-0 flex-1">
        {/* Stretched link: the whole row opens the note, the favorite stays its own button. */}
        <Link
          href={`/notes/${n.id}`}
          className="block truncate text-sm font-semibold outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
        >
          {n.title}
        </Link>
        <p className="mt-0.5 flex min-w-0 items-center gap-2 text-[0.8125rem] text-muted-foreground">
          <span className="shrink-0">{meta.label}</span>
          <TagList tags={n.tags} max={1} className="min-w-0 flex-nowrap overflow-hidden lg:hidden" />
          <span className="truncate md:hidden">· {formatDistanceToNow(n.updated_at, lang)}</span>
        </p>
      </div>
      <TagList tags={n.tags} max={3} className="hidden lg:inline-flex" />
      <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground tabular md:block">
        {formatDistanceToNow(n.updated_at, lang)}
      </span>
      <div className="relative z-10 flex shrink-0 items-center">
        <FavoriteButton id={n.id} kind="note" isFavorite={n.is_favorite} queryKey={queryKey} />
      </div>
    </li>
  )
}

function RowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="divide-y" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="hidden h-3 w-16 md:block" />
        </li>
      ))}
    </ul>
  )
}

function NotesList() {
  const sp = useSearchParams()
  const router = useRouter()
  const { t } = useT()
  const [search, setSearch] = useState(sp.get('q') ?? '')
  const q = sp.get('q') ?? ''
  const favOnly = sp.get('favorites_only') === 'true'
  const page = Number(sp.get('page') ?? 1)
  const queryKey = ['notes', q, favOnly, page]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => notesApi.list({ q: q || undefined, favorites_only: favOnly || undefined, page }),
  })

  const updateParam = (key: string, val: string | null, keepPage = false) => {
    const p = new URLSearchParams(sp.toString())
    if (val) p.set(key, val)
    else p.delete(key)
    if (!keepPage) p.delete('page')
    router.push(`/notes${p.size ? `?${p}` : ''}`)
  }

  const filtered = !!q || favOnly
  const clearFilters = () => { setSearch(''); router.push('/notes') }

  return (
    <PageContainer size="wide">
      <PageHeader
        title={t.notes.title}
        description={data ? `${data.total} saved — recovery codes, PINs and private notes.` : 'Recovery codes, PINs and private notes.'}
        actions={
          <Button asChild>
            <Link href="/notes/new"><Plus aria-hidden="true" />{t.nav.newNote}</Link>
          </Button>
        }
      />

      <div className="flex gap-2">
        <SearchField
          value={search}
          onChange={setSearch}
          onSubmit={(v) => updateParam('q', v.trim() || null)}
          placeholder={t.notes.searchPlaceholder}
          label={t.notes.searchPlaceholder}
        />
        <FavoritesToggle
          pressed={favOnly}
          onPressedChange={(p) => updateParam('favorites_only', p ? 'true' : null)}
          label={t.common.favorites}
        />
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="overflow-hidden rounded-xl border bg-card"><RowsSkeleton /></div>
        ) : data?.items.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={SearchX}
              title="Nothing matches these filters"
              description="Try a different word, or clear the filters to see every note."
              action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
            />
          ) : (
            <EmptyState
              icon={StickyNote}
              title="Keep what doesn’t fit in a password field"
              description="Recovery codes, Wi-Fi details, where the land certificate is kept. Notes are encrypted before they are stored."
              action={<Button asChild><Link href="/notes/new"><Plus aria-hidden="true" />{t.notes.addFirst}</Link></Button>}
            />
          )
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <ul className="divide-y">
              {data?.items.map((n) => <NoteRow key={n.id} n={n} queryKey={queryKey} />)}
            </ul>
          </div>
        )}

        {data && (
          <Pagination page={page} pages={data.pages} onPageChange={(p) => updateParam('page', String(p), true)} />
        )}
      </div>
    </PageContainer>
  )
}

export default function NotesPage() {
  return <Suspense><NotesList /></Suspense>
}
