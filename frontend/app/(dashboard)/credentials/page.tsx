'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, KeyRound, Plus, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FavoriteButton } from '@/components/features/favorite-button'
import { CopyButton } from '@/components/features/copy-button'
import { UpgradeModal } from '@/components/features/upgrade-modal'
import { PageContainer, PageHeader } from '@/components/shared/page'
import { SearchField, FilterChips, FavoritesToggle } from '@/components/shared/filters'
import { EmptyState } from '@/components/shared/empty-state'
import { ItemTile } from '@/components/shared/item-tile'
import { EnvBadge, ExpiryBadge, TagList } from '@/components/shared/badges'
import { Pagination } from '@/components/shared/pagination'
import { credentialsApi, type Credential } from '@/lib/api'
import { CREDENTIAL_TYPES, credentialMeta } from '@/lib/item-meta'
import { formatDistanceToNow } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const ENVS = ['all', 'prod', 'staging', 'dev', 'global']
const ENV_LABELS: Record<string, string> = { prod: 'Production', staging: 'Staging', dev: 'Development', global: 'Global' }

function hostOf(url: string | null) {
  if (!url) return null
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

function CredentialRow({ c, queryKey }: { c: Credential; queryKey: unknown[] }) {
  const { lang } = useT()
  const meta = credentialMeta(c.type)
  const subtitle = c.username ?? c.email ?? hostOf(c.website_url)
  const copyValue = c.username ?? c.email

  return (
    <li className="group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:gap-4 sm:px-5">
      <ItemTile icon={meta.icon} tone={meta.tone} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          {/* The stretched link makes the whole row clickable while
              the action buttons stay separate, valid interactive elements. */}
          <Link
            href={`/credentials/${c.id}`}
            className="max-w-full truncate text-sm font-semibold outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
          >
            {c.label}
          </Link>
          <EnvBadge env={c.env} />
          <ExpiryBadge expiresAt={c.expires_at} />
        </div>
        <p className="mt-0.5 truncate text-[0.8125rem] text-muted-foreground">
          {subtitle ?? meta.label}
        </p>
      </div>
      <TagList tags={c.tags} max={2} className="hidden lg:inline-flex" />
      <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground tabular md:block">
        {formatDistanceToNow(c.updated_at, lang)}
      </span>
      <div className="relative z-10 flex shrink-0 items-center gap-0.5">
        {copyValue && (
          <CopyButton
            value={copyValue}
            label={c.username ? 'Username' : 'Email'}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          />
        )}
        {c.website_url && (
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            className="hidden text-muted-foreground hover:text-foreground sm:inline-flex sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          >
            <a href={c.website_url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${c.label} website`}>
              <ExternalLink aria-hidden="true" />
            </a>
          </Button>
        )}
        <FavoriteButton id={c.id} kind="credential" isFavorite={c.is_favorite} queryKey={queryKey} />
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
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="hidden h-3 w-16 md:block" />
        </li>
      ))}
    </ul>
  )
}

function CredentialsList() {
  const sp = useSearchParams()
  const router = useRouter()
  const { t } = useT()
  const [search, setSearch] = useState(sp.get('q') ?? '')
  const [upgradeOpen, setUpgradeOpen] = useState(sp.get('upgrade') === '1')
  const q = sp.get('q') ?? ''
  const type = sp.get('type') ?? 'all'
  const env = sp.get('env') ?? 'all'
  const favOnly = sp.get('favorites_only') === 'true'
  const page = Number(sp.get('page') ?? 1)
  const queryKey = ['credentials', q, type, env, favOnly, page]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => credentialsApi.list({
      q: q || undefined,
      type: type === 'all' ? undefined : type,
      env: env === 'all' ? undefined : env,
      favorites_only: favOnly || undefined,
      page,
    }),
  })

  const updateParam = (key: string, val: string | null, keepPage = false) => {
    const p = new URLSearchParams(sp.toString())
    if (val) p.set(key, val)
    else p.delete(key)
    if (!keepPage) p.delete('page')
    router.push(`/credentials${p.size ? `?${p}` : ''}`)
  }

  const filtered = !!q || type !== 'all' || env !== 'all' || favOnly
  const clearFilters = () => { setSearch(''); router.push('/credentials') }

  const typeOptions = [
    { value: 'all', label: t.common.all },
    ...Object.entries(CREDENTIAL_TYPES).map(([value, m]) => ({ value, label: m.label })),
  ]

  return (
    <PageContainer size="wide">
      <PageHeader
        title={t.credentials.title}
        description={data ? `${data.total} saved — passwords, keys and logins.` : 'Passwords, keys and logins.'}
        actions={
          <Button asChild>
            <Link href="/credentials/new"><Plus aria-hidden="true" />{t.nav.newCredential}</Link>
          </Button>
        }
      />
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason={sp.get('upgrade') === '1' ? 'You have reached the free plan’s 100 credentials. Upgrade for unlimited storage.' : undefined}
      />

      <div className="space-y-3">
        <div className="flex gap-2">
          <SearchField
            value={search}
            onChange={setSearch}
            onSubmit={(v) => updateParam('q', v.trim() || null)}
            placeholder={t.credentials.searchPlaceholder}
            label={t.credentials.searchPlaceholder}
          />
          <Select value={env} onValueChange={(v) => updateParam('env', v === 'all' ? null : v)}>
            <SelectTrigger className="w-32 shrink-0 sm:w-40" aria-label="Environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENVS.map((e) => <SelectItem key={e} value={e}>{e === 'all' ? t.credentials.allEnvs : ENV_LABELS[e]}</SelectItem>)}
            </SelectContent>
          </Select>
          <FavoritesToggle
            pressed={favOnly}
            onPressedChange={(p) => updateParam('favorites_only', p ? 'true' : null)}
            label={t.common.favorites}
          />
        </div>
        <FilterChips
          label="Category"
          options={typeOptions}
          value={type}
          onChange={(v) => updateParam('type', v === 'all' ? null : v)}
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
              description="Try a different word, or clear the filters to see everything."
              action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
            />
          ) : (
            <EmptyState
              icon={KeyRound}
              title="Your vault is ready"
              description="Save your first password — bank, email, the family Wi-Fi. It is encrypted before it is stored."
              action={<Button asChild><Link href="/credentials/new"><Plus aria-hidden="true" />{t.credentials.addFirst}</Link></Button>}
            />
          )
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <ul className="divide-y">
              {data?.items.map((c) => <CredentialRow key={c.id} c={c} queryKey={queryKey} />)}
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

export default function CredentialsPage() {
  return <Suspense><CredentialsList /></Suspense>
}
