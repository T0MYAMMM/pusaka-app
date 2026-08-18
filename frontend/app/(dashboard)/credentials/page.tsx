'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CredentialTypeBadge } from '@/components/features/credential-type-badge'
import { FavoriteButton } from '@/components/features/favorite-button'
import { UpgradeModal } from '@/components/features/upgrade-modal'
import { credentialsApi } from '@/lib/api'
import { formatDistanceToNow } from '@/lib/utils'

const TYPES = ['all','website','email','social','banking','work','personal','server','api','other']
const ENVS = ['all', 'dev', 'staging', 'prod', 'global']

const ENV_COLORS: Record<string, string> = {
  dev: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  staging: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  prod: 'bg-red-500/15 text-red-600 dark:text-red-400',
  global: 'bg-muted text-muted-foreground',
}

function EnvBadge({ env }: { env: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ENV_COLORS[env] ?? ENV_COLORS.global}`}>
      {env}
    </span>
  )
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return null
  const exp = new Date(expiresAt)
  const now = new Date()
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">Expired</span>
  }
  if (daysLeft <= 14) {
    return <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">Expires in {daysLeft}d</span>
  }
  return null  // Don't clutter cards for credentials expiring far in the future
}

function CredentialsList() {
  const sp = useSearchParams()
  const router = useRouter()
  const [search, setSearch] = useState(sp.get('q') ?? '')
  const [upgradeOpen, setUpgradeOpen] = useState(sp.get('upgrade') === '1')
  const [upgradeReason, setUpgradeReason] = useState<string | undefined>(
    sp.get('upgrade') === '1' ? 'Free plan limit reached (100 credentials). Upgrade for unlimited storage.' : undefined
  )
  const type = sp.get('type') ?? 'all'
  const env = sp.get('env') ?? 'all'
  const favOnly = sp.get('favorites_only') === 'true'
  const page = Number(sp.get('page') ?? 1)

  const { data, isLoading } = useQuery({
    queryKey: ['credentials', search, type, env, favOnly, page],
    queryFn: () => credentialsApi.list({
      q: search || undefined,
      type: type === 'all' ? undefined : type,
      env: env === 'all' ? undefined : env,
      favorites_only: favOnly || undefined,
      page,
    }),
  })

  const updateParam = (key: string, val: string | null) => {
    const p = new URLSearchParams(sp.toString())
    val ? p.set(key, val) : p.delete(key)
    p.delete('page')
    router.push(`/credentials?${p}`)
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Credentials</h1>
          {data && <p className="text-sm text-muted-foreground">{data.total} total</p>}
        </div>
        <Link href="/credentials/new"><Button size="sm"><Plus className="mr-2 h-4 w-4" />Add</Button></Link>
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason={upgradeReason} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-36">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search credentials…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateParam('q', search || null)}
            className="pl-9"
          />
        </div>
        <Select value={type} onValueChange={(v) => updateParam('type', v === 'all' ? null : v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t === 'all' ? 'All types' : t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={env} onValueChange={(v) => updateParam('env', v === 'all' ? null : v)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ENVS.map((e) => <SelectItem key={e} value={e}>{e === 'all' ? 'All envs' : e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant={favOnly ? 'default' : 'outline'} size="sm" onClick={() => updateParam('favorites_only', favOnly ? null : 'true')}>
          ★ Favorites
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <KeyRound className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No credentials found.</p>
          <Link href="/credentials/new"><Button variant="outline">Add your first credential</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.items.map((c) => (
            <Link key={c.id} href={`/credentials/${c.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{c.label}</CardTitle>
                    <p className="truncate text-xs text-muted-foreground">{c.username ?? c.email ?? c.website_url ?? '—'}</p>
                  </div>
                  <FavoriteButton id={c.id} kind="credential" isFavorite={c.is_favorite} queryKey={['credentials', search, type, env, favOnly, page]} />
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <CredentialTypeBadge type={c.type} />
                  {c.env && c.env !== 'global' && <EnvBadge env={c.env} />}
                  <ExpiryBadge expiresAt={c.expires_at} />
                  {c.tags?.split(',').slice(0,3).map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">{t.trim()}</Badge>
                  ))}
                  <span className="ml-auto text-xs text-muted-foreground">{formatDistanceToNow(c.updated_at)}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>Previous</Button>
          <span className="flex items-center px-2 text-sm">{page} / {data.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => updateParam('page', String(page + 1))}>Next</Button>
        </div>
      )}
    </div>
  )
}

export default function CredentialsPage() {
  return <Suspense><CredentialsList /></Suspense>
}
