'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Search, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer, PageHeader } from '@/components/shared/page'
import { SearchField } from '@/components/shared/filters'
import { EmptyState } from '@/components/shared/empty-state'
import { ItemTile } from '@/components/shared/item-tile'
import { EnvBadge, TagList } from '@/components/shared/badges'
import { Kbd } from '@/components/shared/kbd'
import { useCommandPalette } from '@/components/layout/command-palette'
import { dashboardApi, type Credential, type Note } from '@/lib/api'
import { credentialMeta, noteMeta, type ItemMeta } from '@/lib/item-meta'
import { formatDistanceToNow } from '@/lib/utils'
import { useDebounced } from '@/lib/hooks'
import { useT } from '@/lib/i18n'

function ResultRow({
  href, title, subtitle, meta, badges, tags, updatedAt,
}: {
  href: string
  title: string
  subtitle: string
  meta: ItemMeta
  badges?: React.ReactNode
  tags: string | null
  updatedAt: string
}) {
  const { lang } = useT()
  return (
    <li className="group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:gap-4 sm:px-5">
      <ItemTile icon={meta.icon} tone={meta.tone} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={href}
            className="truncate text-sm font-semibold outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
          >
            {title}
          </Link>
          {badges}
        </div>
        <p className="mt-0.5 truncate text-[0.8125rem] text-muted-foreground">{subtitle}</p>
      </div>
      <TagList tags={tags} max={2} className="hidden lg:inline-flex" />
      <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground tabular md:block">
        {formatDistanceToNow(updatedAt, lang)}
      </span>
    </li>
  )
}

function ResultGroup({ id, title, count, shown, children }: {
  id: string; title: string; count: number; shown: number; children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className="space-y-2">
      <h2 id={id} className="flex items-baseline gap-2 px-1 text-[0.9375rem] font-semibold">
        {title}
        <span className="text-sm font-normal text-muted-foreground tabular">
          {shown < count ? `${shown} of ${count}` : count}
        </span>
      </h2>
      <div className="overflow-hidden rounded-xl border bg-card">
        <ul className="divide-y">{children}</ul>
      </div>
    </section>
  )
}

const credentialSubtitle = (c: Credential, fallback: string) => c.username ?? c.email ?? c.website_url ?? fallback

function Results({ q }: { q: string }) {
  const { t } = useT()
  const { open } = useCommandPalette()
  const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => dashboardApi.search({ q }),
    enabled: q.length >= 2,
  })

  if (q.length < 2) {
    return (
      <EmptyState
        icon={Search}
        title="Search everything in your vault"
        description={
          <>
            {t.shell.typeToSearch}
            <span className="mt-2 flex items-center justify-center gap-1.5">
              From any page, press <Kbd>⌘</Kbd><Kbd>K</Kbd> or <Kbd>Ctrl</Kbd><Kbd>K</Kbd>.
            </span>
          </>
        }
        action={<Button variant="outline" onClick={open}>Open quick search</Button>}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border bg-card">
        <ul className="divide-y" aria-busy="true" aria-label="Loading">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-40" /><Skeleton className="h-3 w-28" /></div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (!data) return null

  const total = data.total_credentials + data.total_notes
  if (total === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={`Nothing matches “${q}”`}
        description="Check the spelling, or try part of a name, username or website."
      />
    )
  }

  return (
    <div className="space-y-6">
      <p className="px-1 text-sm text-muted-foreground" role="status">
        {total} {total === 1 ? 'result' : 'results'} for “{q}”
      </p>

      {data.credentials.length > 0 && (
        <ResultGroup id="results-credentials" title={t.nav.credentials} count={data.total_credentials} shown={data.credentials.length}>
          {data.credentials.map((c) => {
            const meta = credentialMeta(c.type)
            return (
              <ResultRow
                key={c.id}
                href={`/credentials/${c.id}`}
                title={c.label}
                subtitle={credentialSubtitle(c, meta.label)}
                meta={meta}
                badges={<EnvBadge env={c.env} />}
                tags={c.tags}
                updatedAt={c.updated_at}
              />
            )
          })}
        </ResultGroup>
      )}

      {data.notes.length > 0 && (
        <ResultGroup id="results-notes" title={t.nav.notes} count={data.total_notes} shown={data.notes.length}>
          {data.notes.map((n: Note) => {
            const meta = noteMeta(n.type)
            return (
              <ResultRow
                key={n.id}
                href={`/notes/${n.id}`}
                title={n.title}
                subtitle={meta.label}
                meta={meta}
                tags={n.tags}
                updatedAt={n.updated_at}
              />
            )
          })}
        </ResultGroup>
      )}
    </div>
  )
}

function SearchPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const { t } = useT()
  const q = (sp.get('q') ?? '').trim()
  const [search, setSearch] = useState(sp.get('q') ?? '')
  const debounced = useDebounced(search.trim(), 300)

  // Keep the URL in step with what is typed, so results are shareable and survive reloads.
  // Only react to typing: back/forward changes `q` without touching `debounced`.
  const synced = useRef(debounced)
  useEffect(() => {
    if (synced.current === debounced) return
    synced.current = debounced
    if (debounced === q) return
    router.replace(debounced ? `/search?q=${encodeURIComponent(debounced)}` : '/search', { scroll: false })
  }, [debounced, q, router])

  const submit = (v: string) => {
    const next = v.trim()
    router.replace(next ? `/search?q=${encodeURIComponent(next)}` : '/search', { scroll: false })
  }

  return (
    <PageContainer>
      <PageHeader title={t.common.search} description="Find credentials and secure notes by name, username, website or tag." />
      <div className="mb-6">
        <SearchField
          value={search}
          onChange={setSearch}
          onSubmit={submit}
          placeholder="Search credentials and notes…"
          label="Search credentials and notes"
        />
      </div>
      <Results q={q} />
    </PageContainer>
  )
}

export default function SearchPageWrapper() {
  return <Suspense><SearchPage /></Suspense>
}
