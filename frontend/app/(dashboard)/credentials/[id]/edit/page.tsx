'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { CredentialForm, type CredentialFormValues } from '@/components/features/credential-form'
import { EmptyState } from '@/components/shared/empty-state'
import { PageContainer, PageHeader } from '@/components/shared/page'
import { credentialsApi } from '@/lib/api'
import Link from 'next/link'

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
      toast.success(`“${cred.label}” updated`)
      router.push(`/credentials/${id}`)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not save changes. Try again.'),
  })

  if (isLoading) {
    return (
      <PageContainer size="narrow" className="space-y-5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </PageContainer>
    )
  }

  if (!data) {
    return (
      <PageContainer size="narrow">
        <EmptyState
          icon={KeyRound}
          title="This credential doesn’t exist"
          description="It may have been deleted, or the link is wrong."
          action={<Button asChild variant="outline"><Link href="/credentials">Back to credentials</Link></Button>}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="narrow">
      <PageHeader back={{ href: `/credentials/${id}`, label: data.label }} title={`Edit ${data.label}`} />
      <CredentialForm
        defaultValues={data}
        submitLabel="Save changes"
        cancelHref={`/credentials/${id}`}
        isSubmitting={isPending}
        onSubmit={async (d) => { await mutateAsync(d) }}
      />
    </PageContainer>
  )
}
