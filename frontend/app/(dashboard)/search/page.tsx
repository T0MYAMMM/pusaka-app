'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Search, KeyRound, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { CredentialTypeBadge } from '@/components/features/credential-type-badge'
import { dashboardApi } from '@/lib/api'
import { formatDistanceToNow } from '@/lib/utils'

function SearchResults({ q }: { q: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => dashboardApi.search({ q }),
    enabled: q.length >= 2,
  })

  if (q.length < 2) return <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
  if (isLoading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
  if (!data) return null

  const total = data.total_credentials + data.total_notes
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{total} result{total !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;</p>

      {data.credentials.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Credentials ({data.total_credentials})</h2>
          </div>
          {data.credentials.map((c) => (
            <Link key={c.id} href={`/credentials/${c.id}`}>
              <Card className="transition-shadow hover:shadow-sm">
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.username ?? c.email ?? '—'}</p>
                  </div>
                  <CredentialTypeBadge type={c.type} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data.credentials.length > 0 && data.notes.length > 0 && <Separator />}

      {data.notes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Secure Notes ({data.total_notes})</h2>
          </div>
          {data.notes.map((n) => (
            <Link key={n.id} href={`/notes/${n.id}`}>
              <Card className="transition-shadow hover:shadow-sm">
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <p className="truncate font-medium">{n.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{n.type}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(n.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {total === 0 && <p className="text-sm text-muted-foreground">No results found.</p>}
    </div>
  )
}

function SearchPage() {
  const [q, setQ] = useState('')

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Search credentials and notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 text-base"
        />
      </div>
      <SearchResults q={q} />
    </div>
  )
}

export default function SearchPageWrapper() {
  return <Suspense><SearchPage /></Suspense>
}
