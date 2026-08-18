'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CredentialForm, type CredentialFormValues } from '@/components/features/credential-form'
import { credentialsApi } from '@/lib/api'

export default function EditCredentialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['credential', id],
    queryFn: () => credentialsApi.get(Number(id)),
  })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: CredentialFormValues) => credentialsApi.update(Number(id), values),
    onSuccess: (cred) => {
      qc.invalidateQueries({ queryKey: ['credentials'] })
      qc.invalidateQueries({ queryKey: ['credential', id] })
      toast.success(`"${cred.label}" updated`)
      router.push(`/credentials/${id}`)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Update failed'),
  })

  if (isLoading) return <div className="p-4 sm:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>
  if (!data) return <div className="p-6 text-muted-foreground">Credential not found.</div>

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/credentials/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Edit {data.label}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Credential Details</CardTitle></CardHeader>
        <CardContent>
          <CredentialForm defaultValues={data} submitLabel="Update Credential" isSubmitting={isPending} onSubmit={async (d) => { await mutateAsync(d) }} />
        </CardContent>
      </Card>
    </div>
  )
}
