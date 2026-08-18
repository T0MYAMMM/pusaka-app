'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, FolderArchive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FavoriteButton } from '@/components/features/favorite-button'
import { documentsApi } from '@/lib/api'
import { formatDistanceToNow, formatBytes } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const DOC_TYPES = ['identity', 'certificate', 'financial', 'medical', 'legal', 'insurance', 'travel', 'other']

function DocumentsList() {
  const sp = useSearchParams()
  const router = useRouter()
  const { t } = useT()
  const [search, setSearch] = useState(sp.get('q') ?? '')
  const typeFilter = sp.get('type') ?? ''
  const favOnly = sp.get('favorites_only') === 'true'
  const page = Number(sp.get('page') ?? 1)

  const { data, isLoading } = useQuery({
    queryKey: ['documents', search, typeFilter, favOnly, page],
    queryFn: () => documentsApi.list({
      q: search || undefined,
      type_filter: typeFilter || undefined,
      favorites_only: favOnly || undefined,
      page,
    }),
  })

  const updateParam = (key: string, val: string | null) => {
    const p = new URLSearchParams(sp.toString())
    val ? p.set(key, val) : p.delete(key)
    p.delete('page')
    router.push(`/documents?${p}`)
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.documents.title}</h1>
          {data && <p className="text-sm text-muted-foreground">{data.total} {t.common.total}</p>}
        </div>
        <Link href="/documents/new">
          <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t.documents.upload}</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-36">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.documents.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateParam('q', search || null)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter || 'all'} onValueChange={(v) => updateParam('type', v === 'all' ? null : v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t.documents.allTypes} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.documents.allTypes}</SelectItem>
            {DOC_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t.documents.types[type as keyof typeof t.documents.types]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant={favOnly ? 'default' : 'outline'} size="sm" onClick={() => updateParam('favorites_only', favOnly ? null : 'true')}>
          ★ {t.common.favorites}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <FolderArchive className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">{t.documents.noFound}</p>
          <Link href="/documents/new"><Button variant="outline">{t.documents.addFirst}</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.items.map((doc) => (
            <Link key={doc.id} href={`/documents/${doc.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="truncate text-base">{doc.title}</CardTitle>
                  <FavoriteButton id={doc.id} kind="document" isFavorite={doc.is_favorite} queryKey={['documents', search, typeFilter, favOnly, page]} />
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {t.documents.types[doc.document_type as keyof typeof t.documents.types] ?? doc.document_type}
                    </Badge>
                    {doc.tags?.split(',').slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag.trim()}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{doc.file_name}</span>
                    <span className="shrink-0 ml-2">{formatBytes(doc.file_size)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(doc.updated_at)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>{t.common.previous}</Button>
          <span className="flex items-center px-2 text-sm">{page} / {data.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => updateParam('page', String(page + 1))}>{t.common.next}</Button>
        </div>
      )}
    </div>
  )
}

export default function DocumentsPage() {
  return <Suspense><DocumentsList /></Suspense>
}
