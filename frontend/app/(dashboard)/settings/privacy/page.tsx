'use client'

import { useQuery } from '@tanstack/react-query'
import { Download, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { dashboardApi } from '@/lib/api'
import { formatDistanceToNow } from '@/lib/utils'

const ACTION_LABELS: Record<string, string> = {
  login: 'Login', logout: 'Logout', register: 'Register',
  create_credential: 'Created credential', view_credential: 'Viewed credential',
  update_credential: 'Updated credential', delete_credential: 'Deleted credential',
  create_note: 'Created note', view_note: 'Viewed note',
  update_note: 'Updated note', delete_note: 'Deleted note',
  export_data: 'Exported data',
}

export default function PrivacySettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['activity', 1],
    queryFn: () => dashboardApi.activity({ page: 1, limit: 10 }),
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Privacy</h1>
        <p className="text-sm text-muted-foreground">Your data and activity history</p>
      </div>

      <Separator />

      {/* Export */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Export your data</h2>
        <p className="text-sm text-muted-foreground">
          Download all your credentials as a CSV file. Passwords and secrets are excluded for security.
        </p>
        <a href={dashboardApi.export()} download>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </a>
      </section>

      <Separator />

      {/* Recent activity */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent activity</h2>
          <a href="/activity" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
            View full log
          </a>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : data?.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {data?.items.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <Activity className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{a.description}</p>
                  {a.ip_address && <p className="text-xs text-muted-foreground">from {a.ip_address}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs hidden sm:flex">
                    {ACTION_LABELS[a.action] ?? a.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(a.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
