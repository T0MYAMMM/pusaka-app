'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { FavoriteButton } from '@/components/features/favorite-button'
import { notesApi } from '@/lib/api'
import { formatDistanceToNow } from '@/lib/utils'

function NotesList() {
  const sp = useSearchParams()
  const router = useRouter()
  const [search, setSearch] = useState(sp.get('q') ?? '')
  const favOnly = sp.get('favorites_only') === 'true'
  const page = Number(sp.get('page') ?? 1)

  const { data, isLoading } = useQuery({
    queryKey: ['notes', search, favOnly, page],
    queryFn: () => notesApi.list({ q: search || undefined, favorites_only: favOnly || undefined, page }),
  })

  const updateParam = (key: string, val: string | null) => {
    const p = new URLSearchParams(sp.toString())
    val ? p.set(key, val) : p.delete(key)
    p.delete('page')
    router.push(`/notes?${p}`)
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Secure Notes</h1>
          {data && <p className="text-sm text-muted-foreground">{data.total} total</p>}
        </div>
        <Link href="/notes/new"><Button size="sm"><Plus className="mr-2 h-4 w-4" />Add</Button></Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-36">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateParam('q', search || null)}
            className="pl-9"
          />
        </div>
        <Button variant={favOnly ? 'default' : 'outline'} size="sm" onClick={() => updateParam('favorites_only', favOnly ? null : 'true')}>
          ★ Favorites
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No notes found.</p>
          <Link href="/notes/new"><Button variant="outline">Add your first note</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.items.map((n) => (
            <Link key={n.id} href={`/notes/${n.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="truncate text-base">{n.title}</CardTitle>
                  <FavoriteButton id={n.id} kind="note" isFavorite={n.is_favorite} queryKey={['notes', search, favOnly, page]} />
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{n.type}</Badge>
                  {n.tags?.split(',').slice(0,2).map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">{t.trim()}</Badge>
                  ))}
                  <span className="ml-auto text-xs text-muted-foreground">{formatDistanceToNow(n.updated_at)}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

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

export default function NotesPage() {
  return <Suspense><NotesList /></Suspense>
}
