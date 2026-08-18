'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Activity, LogIn, LogOut, UserPlus, KeyRound, FileText, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { dashboardApi } from '@/lib/api'
import { formatDistanceToNow } from '@/lib/utils'

const ACTION_META: Record<string, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  login:             { label: 'Login',            icon: LogIn,    variant: 'secondary' },
  logout:            { label: 'Logout',           icon: LogOut,   variant: 'outline' },
  register:          { label: 'Register',         icon: UserPlus, variant: 'secondary' },
  create_credential: { label: 'Created',          icon: KeyRound, variant: 'default' },
  view_credential:   { label: 'Viewed',           icon: KeyRound, variant: 'outline' },
  update_credential: { label: 'Updated',          icon: KeyRound, variant: 'secondary' },
  delete_credential: { label: 'Deleted',          icon: KeyRound, variant: 'destructive' },
  create_note:       { label: 'Created',          icon: FileText, variant: 'default' },
  view_note:         { label: 'Viewed',           icon: FileText, variant: 'outline' },
  update_note:       { label: 'Updated',          icon: FileText, variant: 'secondary' },
  delete_note:       { label: 'Deleted',          icon: FileText, variant: 'destructive' },
  export_data:       { label: 'Export',           icon: Download, variant: 'secondary' },
}

function ActivityList() {
  const sp = useSearchParams()
  const router = useRouter()
  const page = Number(sp.get('page') ?? 1)

  const { data, isLoading } = useQuery({
    queryKey: ['activity', page],
    queryFn: () => dashboardApi.activity({ page, limit: 25 }),
  })

  const goPage = (p: number) => router.push(`/activity?page=${p}`)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Activity Log</h1>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" />Recent Actions</CardTitle></CardHeader>
        <CardContent className="space-y-1 p-0">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="mx-6 mb-2 h-12" />)
            : data?.items.length === 0
            ? <p className="p-6 text-sm text-muted-foreground">No activity yet.</p>
            : data?.items.map((a, i) => {
                const meta = ACTION_META[a.action] ?? { label: a.action, icon: Activity, variant: 'outline' as const }
                const Icon = meta.icon
                return (
                  <div key={a.id} className={`flex items-center gap-4 px-6 py-3 ${i % 2 === 0 ? 'bg-muted/30' : ''}`}>
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{a.description}</p>
                      {a.ip_address && <p className="text-xs text-muted-foreground">from {a.ip_address}</p>}
                    </div>
                    <Badge variant={meta.variant} className="shrink-0 text-xs">{meta.label}</Badge>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDistanceToNow(a.timestamp)}</span>
                  </div>
                )
              })}
        </CardContent>
      </Card>

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>Previous</Button>
          <span className="flex items-center px-2 text-sm">{page} / {data.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => goPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}

export default function ActivityPage() {
  return <Suspense><ActivityList /></Suspense>
}
