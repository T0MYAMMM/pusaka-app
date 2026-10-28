'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Download, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/shared/page'
import { EmptyState } from '@/components/shared/empty-state'
import { ActivityRow, ActivityRowsSkeleton } from '@/components/features/activity-row'
import { dashboardApi } from '@/lib/api'
import { useT } from '@/lib/i18n'

export default function PrivacySettingsPage() {
  const { t } = useT()
  const { data, isLoading } = useQuery({
    // Distinct from the activity page's ['activity', page] (limit 25) so the two never share a cache entry.
    queryKey: ['activity', 'recent', 10],
    queryFn: () => dashboardApi.activity({ page: 1, limit: 10 }),
  })

  return (
    <div className="space-y-5">
      <Panel title={t.settings.exportData} description={t.settings.exportDesc}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            The file is not encrypted. Keep it somewhere safe and delete it when you are done.
          </p>
          <Button variant="outline" asChild className="shrink-0">
            <a href={dashboardApi.export()} download>
              <Download aria-hidden="true" />
              Download CSV
            </a>
          </Button>
        </div>
      </Panel>

      <Panel
        title={t.settings.recentActivity}
        description="The last 10 sign-ins and changes on your account."
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/activity">View full log</Link>
          </Button>
        }
        bodyClassName="p-0"
      >
        {isLoading ? (
          <ActivityRowsSkeleton rows={5} />
        ) : !data?.items.length ? (
          <EmptyState compact icon={History} title="No activity yet" description="Sign-ins and changes to your vault will appear here." />
        ) : (
          <ul className="divide-y">
            {data.items.map((a) => <ActivityRow key={a.id} item={a} />)}
          </ul>
        )}
      </Panel>
    </div>
  )
}
