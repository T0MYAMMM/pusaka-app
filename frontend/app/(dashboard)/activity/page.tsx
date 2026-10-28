'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer, PageHeader } from '@/components/shared/page'
import { EmptyState } from '@/components/shared/empty-state'
import { Pagination } from '@/components/shared/pagination'
import { ActivityRow, ActivityRowsSkeleton } from '@/components/features/activity-row'
import { dashboardApi, type ActivityItem } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const dayKey = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** "Today", "Yesterday", or "Monday, 26 October" — all via Intl. */
function dayLabel(iso: string, lang: string) {
  const d = new Date(iso)
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((startOf(d) - startOf(new Date())) / 86_400_000)
  if (diff === 0 || diff === -1) {
    const s = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(diff, 'day')
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return formatDate(iso, lang, { weekday: 'long', day: 'numeric', month: 'long', ...(sameYear ? {} : { year: 'numeric' }) })
}

function groupByDay(items: ActivityItem[]) {
  const groups: { key: string; first: string; items: ActivityItem[] }[] = []
  for (const item of items) {
    const key = dayKey(item.timestamp)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.items.push(item)
    else groups.push({ key, first: item.timestamp, items: [item] })
  }
  return groups
}

function ActivityList() {
  const sp = useSearchParams()
  const router = useRouter()
  const { t, lang } = useT()
  const page = Number(sp.get('page') ?? 1)

  const { data, isLoading } = useQuery({
    queryKey: ['activity', page],
    queryFn: () => dashboardApi.activity({ page, limit: 25 }),
  })

  const goPage = (p: number) => router.push(p > 1 ? `/activity?page=${p}` : '/activity')

  return (
    <PageContainer>
      <PageHeader
        title={t.nav.activity}
        description={
          data
            ? `${data.total} events — sign-ins and changes to your vault, newest first.`
            : 'Sign-ins and changes to your vault, newest first.'
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="overflow-hidden rounded-xl border bg-card"><ActivityRowsSkeleton rows={8} /></div>
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          icon={History}
          title="Nothing has happened yet"
          description="Every sign-in, view and change to your credentials and notes is recorded here, so you can spot anything unexpected."
        />
      ) : (
        <div className="space-y-6">
          {groupByDay(data.items).map((g) => (
            <section key={g.key} aria-labelledby={`day-${g.key}`} className="space-y-2">
              <h2 id={`day-${g.key}`} className="px-1 text-[0.8125rem] font-semibold text-muted-foreground">
                {dayLabel(g.first, lang)}
              </h2>
              <div className="overflow-hidden rounded-xl border bg-card">
                <ul className="divide-y">
                  {g.items.map((a) => <ActivityRow key={a.id} item={a} />)}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      {data && <Pagination page={page} pages={data.pages} onPageChange={goPage} />}
    </PageContainer>
  )
}

export default function ActivityPage() {
  return <Suspense><ActivityList /></Suspense>
}
