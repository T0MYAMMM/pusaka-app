'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronRight, Clock, Copy, Download, FolderArchive, KeyRound, ShieldCheck, StickyNote, Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageContainer, PageHeader, Panel } from '@/components/shared/page'
import { ItemTile } from '@/components/shared/item-tile'
import { EmptyState } from '@/components/shared/empty-state'
import { credentialsApi, dashboardApi, type ActivityItem, type Credential, type DuplicateGroup, type Note } from '@/lib/api'
import { credentialMeta, daysUntil, noteMeta } from '@/lib/item-meta'
import { cn, formatDistanceToNow } from '@/lib/utils'
import { useGreeting } from '@/lib/hooks'
import { useAuthStore } from '@/lib/store'
import { useT } from '@/lib/i18n'

// ─── Vault health ────────────────────────────────────────────────────
// The one bold element on the page: an indigo batik panel that answers
// "does anything need me?" from the expiring and duplicate endpoints.

function HealthMetric({ value, label, href }: { value: number | undefined; label: string; href?: string }) {
  const body = (
    <>
      <span className="block text-4xl font-extrabold tracking-[-0.03em] text-[#EBC97E] tabular sm:text-[2.75rem]">
        {value ?? '–'}
      </span>
      <span className="mt-1 block text-[0.8125rem] leading-snug text-white/70">{label}</span>
    </>
  )
  return href ? (
    <Link href={href} className="block rounded-lg p-2 -m-2 transition-colors hover:bg-white/5">{body}</Link>
  ) : (
    <div>{body}</div>
  )
}

function AttentionLink({ href, icon: Icon, children }: { href: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-lg bg-white/[0.07] px-3 py-2.5 text-sm text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-[#EBC97E]"
      >
        <Icon className="size-4 shrink-0 text-[#EBC97E]" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{children}</span>
        <ChevronRight className="size-4 shrink-0 text-white/50" aria-hidden="true" />
      </Link>
    </li>
  )
}

function expiryPhrase(expiresAt: string | null) {
  const d = daysUntil(expiresAt)
  if (d === null) return ''
  if (d < 0) return `expired ${-d} day${d === -1 ? '' : 's'} ago`
  if (d === 0) return 'expires today'
  return `expires in ${d} day${d === 1 ? '' : 's'}`
}

function VaultHealth({
  total,
  expiring,
  duplicates,
  loading,
}: {
  total: number | undefined
  expiring: Credential[] | undefined
  duplicates: DuplicateGroup[] | undefined
  loading: boolean
}) {
  const { t } = useT()
  const reusedCount = duplicates?.reduce((n, g) => n + g.credential_ids.length, 0)
  const needsAttention = (expiring?.length ?? 0) + (duplicates?.length ?? 0) > 0

  return (
    <section
      aria-labelledby="health-title"
      className="kawung kawung-fade-r overflow-hidden rounded-2xl bg-[#1E2560] text-white [--kawung-color:rgba(217,174,85,0.16)] [--kawung-size:56px] dark:bg-[#161B45]"
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
        <div className="min-w-0 space-y-5">
          <div className="space-y-2">
            <p id="health-title" className="flex items-center gap-2 text-sm font-semibold text-white/70">
              <ShieldCheck className="size-4 text-[#EBC97E]" aria-hidden="true" />
              {t.dashboard.health}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-80 max-w-full bg-white/10" />
            ) : (
              <p className="max-w-xl text-xl font-bold leading-snug tracking-[-0.01em] text-balance sm:text-2xl">
                {needsAttention ? t.dashboard.healthNeedsAttention : t.dashboard.healthGood}
              </p>
            )}
          </div>

          {needsAttention && (
            <ul className="grid max-w-lg gap-2">
              {expiring?.slice(0, 3).map((c) => (
                <AttentionLink key={`e-${c.id}`} href={`/credentials/${c.id}`} icon={Clock}>
                  <span className="font-semibold">{c.label}</span>
                  <span className="text-white/70"> — {expiryPhrase(c.expires_at)}</span>
                </AttentionLink>
              ))}
              {duplicates?.slice(0, 2).map((g) => (
                <AttentionLink key={`d-${g.credential_ids.join('-')}`} href={`/credentials/${g.credential_ids[0]}`} icon={Copy}>
                  <span className="font-semibold">{g.label_hints.join(' & ')}</span>
                  <span className="text-white/70"> — same password</span>
                </AttentionLink>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 self-end border-t border-white/10 pt-6 sm:gap-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
          <HealthMetric value={total} label={t.dashboard.itemsKept} />
          <HealthMetric value={expiring?.length} label={t.dashboard.expiringSoon} href="/credentials" />
          <HealthMetric value={reusedCount} label={t.dashboard.reusedPasswords} />
        </div>
      </div>
    </section>
  )
}

// ─── Recent items ────────────────────────────────────────────────────

function RecentRow({ href, icon, tone, title, subtitle, time }: {
  href: string
  icon: ReturnType<typeof credentialMeta>['icon']
  tone: ReturnType<typeof credentialMeta>['tone']
  title: string
  subtitle: string
  time: string
}) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50">
        <ItemTile icon={icon} tone={tone} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{title}</span>
          <span className="block truncate text-[0.8125rem] text-muted-foreground">{subtitle}</span>
        </span>
        <span className="shrink-0 text-xs text-muted-foreground tabular">{time}</span>
      </Link>
    </li>
  )
}

function RowsSkeleton({ rows }: { rows: number }) {
  return (
    <ul className="divide-y" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-5 py-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-36" /><Skeleton className="h-3 w-24" /></div>
        </li>
      ))}
    </ul>
  )
}

function RecentItems({ credentials, notes, loading }: { credentials?: Credential[]; notes?: Note[]; loading: boolean }) {
  const { t, lang } = useT()
  return (
    <section className="overflow-hidden rounded-xl border bg-card lg:col-span-2">
      <Tabs defaultValue="credentials" className="gap-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
          <h2 className="text-[0.9375rem] font-semibold">Recently updated</h2>
          <TabsList>
            <TabsTrigger value="credentials">{t.nav.credentials}</TabsTrigger>
            <TabsTrigger value="notes">{t.nav.notes}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="credentials">
          {loading ? <RowsSkeleton rows={5} /> : credentials && credentials.length > 0 ? (
            <ul className="divide-y">
              {credentials.map((c) => {
                const m = credentialMeta(c.type)
                return (
                  <RecentRow
                    key={c.id}
                    href={`/credentials/${c.id}`}
                    icon={m.icon}
                    tone={m.tone}
                    title={c.label}
                    subtitle={c.username ?? c.email ?? m.label}
                    time={formatDistanceToNow(c.updated_at, lang)}
                  />
                )
              })}
            </ul>
          ) : (
            <EmptyState compact icon={KeyRound} title={t.dashboard.noCredentials} action={<Button asChild size="sm"><Link href="/credentials/new">{t.credentials.addFirst}</Link></Button>} />
          )}
          <Link href="/credentials" className="block border-t px-5 py-3 text-sm font-semibold text-primary hover:bg-muted/50">
            {t.common.viewAll}
          </Link>
        </TabsContent>
        <TabsContent value="notes">
          {loading ? <RowsSkeleton rows={4} /> : notes && notes.length > 0 ? (
            <ul className="divide-y">
              {notes.map((n) => {
                const m = noteMeta(n.type)
                return (
                  <RecentRow
                    key={n.id}
                    href={`/notes/${n.id}`}
                    icon={m.icon}
                    tone={m.tone}
                    title={n.title}
                    subtitle={m.label}
                    time={formatDistanceToNow(n.updated_at, lang)}
                  />
                )
              })}
            </ul>
          ) : (
            <EmptyState compact icon={StickyNote} title={t.dashboard.noNotes} action={<Button asChild size="sm"><Link href="/notes/new">{t.notes.addFirst}</Link></Button>} />
          )}
          <Link href="/notes" className="block border-t px-5 py-3 text-sm font-semibold text-primary hover:bg-muted/50">
            {t.common.viewAll}
          </Link>
        </TabsContent>
      </Tabs>
    </section>
  )
}

// ─── Activity ────────────────────────────────────────────────────────

function RecentActivity({ items, loading }: { items?: ActivityItem[]; loading: boolean }) {
  const { t, lang } = useT()
  return (
    <Panel
      title={t.dashboard.recentActivity}
      action={<Link href="/activity" className="text-sm font-semibold text-primary hover:underline">{t.common.viewAll}</Link>}
    >
      {loading ? (
        <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
      ) : items && items.length > 0 ? (
        <ol className="relative space-y-4 border-l pl-5">
          {items.map((a) => (
            <li key={a.id} className="relative">
              <span className="absolute top-1.5 -left-[1.5625rem] size-2 rounded-full bg-primary ring-4 ring-card" aria-hidden="true" />
              <p className="line-clamp-2 text-sm">{a.description}</p>
              <p className="mt-0.5 text-xs text-muted-foreground tabular">{formatDistanceToNow(a.timestamp, lang)}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">{t.dashboard.noActivity}</p>
      )}
    </Panel>
  )
}

// ─── What's inside ───────────────────────────────────────────────────

function Inside({
  counts,
  types,
  loading,
}: {
  counts: { label: string; value: number; href: string; icon: React.ElementType }[]
  types: { type: string; count: number }[]
  loading: boolean
}) {
  const { t } = useT()
  const max = Math.max(1, ...types.map((x) => x.count))
  const sorted = [...types].sort((a, b) => b.count - a.count)

  return (
    <Panel title="What’s inside" bodyClassName="grid gap-8 p-5 md:grid-cols-[16rem_1fr] md:gap-10">
      <ul className="space-y-1">
        {counts.map(({ label, value, href, icon: Icon }) => (
          <li key={label}>
            <Link href={href} className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-muted/60">
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="flex-1 text-sm">{label}</span>
              {loading ? <Skeleton className="h-4 w-6" /> : <span className="text-sm font-bold tabular">{value}</span>}
            </Link>
          </li>
        ))}
      </ul>

      {/* Single-hue bar list: the job is comparing amounts, so one colour and
          direct labels — no legend, no categorical palette needed. */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">{t.dashboard.credentialsByType}</h3>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5" />)}</div>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.dashboard.noCredentials}</p>
        ) : (
          <ul className="space-y-1">
            {sorted.map(({ type, count }) => {
              const m = credentialMeta(type)
              const Icon = m.icon
              return (
                <li key={type}>
                  <Link
                    href={`/credentials?type=${type}`}
                    className="grid grid-cols-[7rem_1fr_2rem] items-center gap-3 rounded-md py-1.5 text-sm transition-colors hover:bg-muted/60"
                    aria-label={`${m.label}: ${count}`}
                  >
                    <span className="flex items-center gap-2 truncate text-muted-foreground">
                      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                      {m.label}
                    </span>
                    <span className="h-2 rounded-full bg-muted" aria-hidden="true">
                      <span className="block h-full rounded-full bg-chart-1" style={{ width: `${(count / max) * 100}%` }} />
                    </span>
                    <span className="text-right font-semibold tabular">{count}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Panel>
  )
}

// ─── Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useT()
  const user = useAuthStore((s) => s.user)
  const greeting = useGreeting()

  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.stats })
  const expiring = useQuery({ queryKey: ['credentials', 'expiring', 30], queryFn: () => credentialsApi.expiring(30) })
  const duplicates = useQuery({ queryKey: ['credentials', 'duplicates'], queryFn: credentialsApi.duplicates })

  const total = data ? data.total_credentials + data.total_notes + data.total_documents : undefined

  return (
    <PageContainer size="wide">
      <PageHeader
        title={
          greeting && user?.first_name ? (
            <>{t.dashboard[greeting]}, <span translate="no">{user.first_name}</span></>
          ) : (
            t.dashboard.title
          )
        }
        description={t.dashboard.subtitle}
        actions={
          <Button variant="outline" asChild>
            <a href={dashboardApi.export()} download>
              <Download aria-hidden="true" />
              Export CSV
            </a>
          </Button>
        }
      />

      <div className="space-y-5">
        <VaultHealth
          total={total}
          expiring={expiring.data}
          duplicates={duplicates.data}
          loading={isLoading || expiring.isLoading || duplicates.isLoading}
        />

        <div className={cn('grid items-start gap-5 lg:grid-cols-3')}>
          <RecentItems credentials={data?.recent_credentials} notes={data?.recent_notes} loading={isLoading} />
          <RecentActivity items={data?.recent_activities} loading={isLoading} />
        </div>

        <Inside
          loading={isLoading}
          types={data?.credential_types ?? []}
          counts={[
            { label: t.nav.credentials, value: data?.total_credentials ?? 0, href: '/credentials', icon: KeyRound },
            { label: t.nav.notes, value: data?.total_notes ?? 0, href: '/notes', icon: StickyNote },
            { label: t.nav.documents, value: data?.total_documents ?? 0, href: '/documents', icon: FolderArchive },
            {
              label: t.dashboard.favorites,
              value: (data?.favorite_credentials ?? 0) + (data?.favorite_notes ?? 0),
              href: '/credentials?favorites_only=true',
              icon: Star,
            },
          ]}
        />

        {!isLoading && data && total === 0 && (
          <EmptyState
            icon={KeyRound}
            title="Start with one thing you’d hate to lose"
            description="Your bank login, the family Wi-Fi, a scan of your KTP. Add it once — Pusaka keeps it encrypted and close at hand."
            action={<Button asChild><Link href="/credentials/new">{t.nav.newCredential}</Link></Button>}
          />
        )}
      </div>
    </PageContainer>
  )
}
