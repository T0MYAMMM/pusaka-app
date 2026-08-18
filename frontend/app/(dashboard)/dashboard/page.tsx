'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { KeyRound, FileText, FolderArchive, Activity, Download, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { CredentialTypeBadge } from '@/components/features/credential-type-badge'
import { dashboardApi } from '@/lib/api'
import { formatDistanceToNow } from '@/lib/utils'
import { useT } from '@/lib/i18n'

function StatCard({ label, value, icon: Icon, href }: { label: string; value: number; icon: React.ElementType; href: string }) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </Link>
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
      <CardContent><Skeleton className="h-8 w-12" /></CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.stats })
  const { t } = useT()

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 batik-texture">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.dashboard.title}</h1>
          <p className="text-sm text-muted-foreground">{t.dashboard.subtitle}</p>
        </div>
        <a href={dashboardApi.export()} download>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </a>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : data ? (
          <>
            <StatCard label={t.dashboard.totalCredentials} value={data.total_credentials} icon={KeyRound} href="/credentials" />
            <StatCard label={t.dashboard.secureNotes} value={data.total_notes} icon={FileText} href="/notes" />
            <StatCard label={t.dashboard.totalDocuments} value={data.total_documents} icon={FolderArchive} href="/documents" />
          </>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Credentials */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t.dashboard.recentCredentials}</CardTitle>
            <Link href="/credentials" className="text-xs text-muted-foreground hover:text-foreground">{t.common.viewAll}</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />) :
              data?.recent_credentials.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.dashboard.noCredentials}</p>
              ) : data?.recent_credentials.map((c) => (
                <Link key={c.id} href={`/credentials/${c.id}`} className="flex items-center justify-between rounded-md p-2 hover:bg-muted">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.username ?? c.email ?? '—'}</p>
                  </div>
                  <CredentialTypeBadge type={c.type} />
                </Link>
              ))}
          </CardContent>
        </Card>

        {/* Recent Notes */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t.dashboard.recentNotes}</CardTitle>
            <Link href="/notes" className="text-xs text-muted-foreground hover:text-foreground">{t.common.viewAll}</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />) :
              data?.recent_notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.dashboard.noNotes}</p>
              ) : data?.recent_notes.map((n) => (
                <Link key={n.id} href={`/notes/${n.id}`} className="flex items-center justify-between rounded-md p-2 hover:bg-muted">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(n.updated_at)}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{n.type}</Badge>
                </Link>
              ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t.dashboard.recentActivity}</CardTitle>
            <Link href="/activity" className="text-xs text-muted-foreground hover:text-foreground">{t.common.viewAll}</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />) :
              data?.recent_activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.dashboard.noActivity}</p>
              ) : data?.recent_activities.map((a) => (
                <div key={a.id} className="flex items-start gap-2">
                  <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-xs">{a.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(a.timestamp)}</p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Credential type breakdown */}
      {data?.credential_types && data.credential_types.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              {t.dashboard.credentialsByType}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.credential_types.map(({ type, count }) => (
                <Link key={type} href={`/credentials?type=${type}`}>
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm hover:bg-secondary/80">
                    <CredentialTypeBadge type={type} />
                    <Separator orientation="vertical" className="h-4" />
                    <span className="font-bold">{count}</span>
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
