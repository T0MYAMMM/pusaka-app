'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Edit, Globe, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CredentialTypeBadge } from '@/components/features/credential-type-badge'
import { FavoriteButton } from '@/components/features/favorite-button'
import { CopyButton } from '@/components/features/copy-button'
import { DeleteDialog } from '@/components/features/delete-dialog'
import { credentialsApi } from '@/lib/api'
import { formatDistanceToNow } from '@/lib/utils'

export default function CredentialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const [showPass, setShowPass] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['credential', id],
    queryFn: () => credentialsApi.get(Number(id)),
  })

  const { mutate: doDelete, isPending: deleting } = useMutation({
    mutationFn: () => credentialsApi.delete(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credentials'] })
      toast.success('Credential deleted')
      router.push('/credentials')
    },
    onError: () => toast.error('Delete failed'),
  })

  if (isLoading) return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64" />
    </div>
  )

  if (!data) return <div className="p-6 text-muted-foreground">Credential not found.</div>

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/credentials"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{data.label}</h1>
          <div className="flex items-center gap-2 mt-1">
            <CredentialTypeBadge type={data.type} />
            {data.tags?.split(',').map((t) => <Badge key={t} variant="outline" className="text-xs">{t.trim()}</Badge>)}
          </div>
        </div>
        <FavoriteButton id={data.id} kind="credential" isFavorite={data.is_favorite} queryKey={['credential', id]} />
        <Link href={`/credentials/${id}/edit`}><Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" />Edit</Button></Link>
        <DeleteDialog itemName={data.label} onConfirm={() => doDelete()} isPending={deleting} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {data.website_url && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <a href={data.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">{data.website_url}</a>
            </div>
          )}

          {[
            { label: 'Username', value: data.username },
            { label: 'Email', value: data.email },
          ].filter(f => f.value).map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">{value}</span>
                <CopyButton value={value!} label={label} />
              </div>
            </div>
          ))}

          <Separator />

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Password</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">{showPass ? data.password : '•'.repeat(Math.min(data.password.length, 16))}</span>
              <Button variant="ghost" size="icon" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <CopyButton value={data.password} label="Password" />
            </div>
          </div>

          {data.secret_key && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Secret Key / 2FA</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">{showSecret ? data.secret_key : '•'.repeat(Math.min(data.secret_key.length, 16))}</span>
                <Button variant="ghost" size="icon" onClick={() => setShowSecret(!showSecret)}>
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <CopyButton value={data.secret_key} label="Secret key" />
              </div>
            </div>
          )}

          {data.note && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{data.note}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Created {formatDistanceToNow(data.created_at)} · Updated {formatDistanceToNow(data.updated_at)}
        {data.last_accessed && ` · Last viewed ${formatDistanceToNow(data.last_accessed)}`}
      </p>
    </div>
  )
}
