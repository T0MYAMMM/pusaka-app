'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CredentialForm, type CredentialFormValues } from '@/components/features/credential-form'
import { credentialsApi } from '@/lib/api'

export default function NewCredentialPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: CredentialFormValues) => credentialsApi.create(data),
    onSuccess: (cred) => {
      qc.invalidateQueries({ queryKey: ['credentials'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`"${cred.label}" created`)
      router.push(`/credentials/${cred.id}`)
    },
    onError: (e) => {
      if (e instanceof Error && e.message.toLowerCase().includes('limit')) {
        router.push('/credentials?upgrade=1')
      } else {
        toast.error(e instanceof Error ? e.message : 'Create failed')
      }
    },
  })

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/credentials"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Add Credential</h1>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Credential Details</CardTitle></CardHeader>
        <CardContent>
          <CredentialForm submitLabel="Save Credential" isSubmitting={isPending} onSubmit={async (d) => { await mutateAsync(d) }} />
        </CardContent>
      </Card>
    </div>
  )
}
