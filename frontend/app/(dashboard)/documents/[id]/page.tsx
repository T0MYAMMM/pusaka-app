'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, Edit, Trash2, Star, ArrowLeft, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { documentsApi } from '@/lib/api'
import { formatBytes, formatDistanceToNow } from '@/lib/utils'
import { useT } from '@/lib/i18n'

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { t } = useT()
  const docId = Number(id)

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', docId],
    queryFn: () => documentsApi.get(docId),
  })

  const deleteMutation = useMutation({
    mutationFn: () => documentsApi.delete(docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Document deleted')
      router.push('/documents')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const favMutation = useMutation({
    mutationFn: () => documentsApi.toggleFavorite(docId),
    onSuccess: (updated) => {
      qc.setQueryData(['document', docId], updated)
      qc.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Document not found.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{doc.title}</h1>
          <p className="text-sm text-muted-foreground">{formatDistanceToNow(doc.updated_at)}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => favMutation.mutate()}
            disabled={favMutation.isPending}
          >
            <Star className={`h-4 w-4 ${doc.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
          </Button>
          <Link href={`/documents/${docId}/edit`}>
            <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" />{t.common.edit}</Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />{t.common.delete}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete document?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{doc.title}" and its encrypted content. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteMutation.mutate()}
                >
                  {t.common.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* File info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            File Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">File name</p>
              <p className="text-sm font-medium break-all">{doc.file_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">File size</p>
              <p className="text-sm font-medium">{formatBytes(doc.file_size)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Type</p>
              <Badge variant="secondary">
                {t.documents.types[doc.document_type as keyof typeof t.documents.types] ?? doc.document_type}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">MIME type</p>
              <p className="text-sm text-muted-foreground">{doc.mime_type}</p>
            </div>
          </div>

          {doc.description && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{doc.description}</p>
              </div>
            </>
          )}

          {doc.tags && (
            <div className="flex flex-wrap gap-1.5">
              {doc.tags.split(',').map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag.trim()}</Badge>
              ))}
            </div>
          )}

          {doc.expires_at && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Expires</p>
              <p className="text-sm">{new Date(doc.expires_at).toLocaleDateString()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download */}
      <a href={documentsApi.downloadUrl(docId)}>
        <Button className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />{t.documents.download}
        </Button>
      </a>
    </div>
  )
}
